"""Render one PyUI still headlessly: build /mnt/SDCARD, feed scripted buttons, save the last frame.

Usage: python harness.py <DEVICE> <events> <out.png>
Letters: u d l r = D-pad, a b x y, q w = L1 R1, 1 2 = L2 R2, s = START, e = SELECT, m = MENU.

PyUI runs unmodified, as the device name selects it (`mainui.py:63-117`), against a card built from
the spruceOS checkout at `/src` and the fixture at `$FIXTURE`. What the harness changes is the edge
of the device: the display is SDL's offscreen driver with the software renderer, the input is the
scripted buttons, and the hardware readings the top bar shows are fixed. Every frame PyUI presents
is read back, and the last one before the buttons run out is the still. `render-reference.sh` runs
it; see `README.md`.
"""
import ctypes, os, shutil, sys, time
from pathlib import Path

DEVICE, EVENTS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SRC = Path('/src')
CARD = Path('/mnt/SDCARD')
FIXTURE = Path(os.environ.get('FIXTURE', '/tmp/spruceos-fixture'))

def build_card():
    if CARD.exists():
        shutil.rmtree(CARD)
    CARD.mkdir(parents=True)
    for name in ['Emu', 'spruce', 'RetroArch', 'BIOS']:
        (CARD / name).symlink_to(SRC / name)
    # PyUI writes theme settings back into the theme's own config (SELECT's view toggle does), so
    # the theme in use is a copy; the checkout is mounted read-only.
    (CARD / 'Themes').mkdir()
    for theme in (SRC / 'Themes').iterdir():
        if theme.name == 'SPRUCE':
            shutil.copytree(theme, CARD / 'Themes' / theme.name, symlinks=True)
        else:
            (CARD / 'Themes' / theme.name).symlink_to(theme)
    (CARD / 'App').mkdir()
    for app in (SRC / 'App').iterdir():
        if app.name == 'PyUI':
            shutil.copytree(app, CARD / 'App' / 'PyUI', symlinks=True)
        else:
            (CARD / 'App' / app.name).symlink_to(app)
    shutil.copytree(SRC / 'Saves', CARD / 'Saves', symlinks=True)
    shutil.copytree(FIXTURE / 'Roms', CARD / 'Roms')
    # The fixture's lists and save-state screenshots, over the checkout's own Saves.
    shutil.copytree(FIXTURE / 'Saves', CARD / 'Saves', dirs_exist_ok=True)
    Path('/config').mkdir(exist_ok=True)
    # The file the shell leaves when MENU is held in a game: PyUI opens the Game Switcher on start.
    if os.environ.get('GS_TRIGGER'):
        (CARD / 'App/PyUI/pyui_gs_trigger').touch()

build_card()
os.environ.setdefault('SDL_VIDEODRIVER', 'offscreen')
os.environ.setdefault('SDL_RENDER_DRIVER', 'software')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')
sys.path.insert(0, str(CARD / 'App/PyUI/main-ui'))
os.chdir(CARD / 'App/PyUI/main-ui')

import sdl2
os.makedirs('/tmp/pyui-logs', exist_ok=True)

# The hardware watchers read /dev/input; there is none, so they do nothing.
import controller.key_watcher as key_watcher
class NoKeys:
    def __init__(self, *a, **k): pass
    def poll_keyboard(self, *a, **k): return None
    def __getattr__(self, name): return lambda *a, **k: None
key_watcher.KeyWatcher = NoKeys

import mainui
from devices.device import Device
from devices.charge.charge_status import ChargeStatus
from devices.wifi.wifi_status import WifiStatus

# The hardware readings the status bar shows, fixed so every frame is the same frame.
# Constructors write the backlight and screen tuning straight to hardware; there is none.
import importlib
for mod, cls in [('devices.anbernic.anbernic_xx_common', 'AnbernicXXCommon'), ('devices.miyoo.flip.miyoo_flip', 'MiyooFlip'),
                 ('devices.miyoo.a30.miyoo_a30', 'MiyooA30'), ('devices.miniloong.miniloong_pocket1', 'MiniloongPocket1')]:
    try:
        klass = getattr(importlib.import_module(mod), cls)
    except Exception as e:
        print('no', mod, cls, e)
        continue
    for name in ('_set_lumination_to_config', '_set_screen_settings_to_config', 'init_gpio'):
        if hasattr(klass, name):
            setattr(klass, name, lambda self, *a, **k: None)

# The one-time "optimize boxart?" prompt is answered once on a real card; only its own still shows it.
from devices.miyoo.device_user_config import DeviceUserConfig
if not os.environ.get('BOXART_PROMPT'):
    DeviceUserConfig.never_prompt_boxart_resize = lambda self: True

orig_init = Device.init
def init(impl):
    # Some devices choose KMSDRM for themselves; the harness draws offscreen whatever they choose.
    os.environ['SDL_VIDEODRIVER'] = 'offscreen'
    os.environ['SDL_RENDER_DRIVER'] = 'software'
    os.environ.pop('KMSDRM_DEVICE', None)
    impl.get_battery_percent = lambda *a, **k: 75
    impl.get_charge_status = lambda *a, **k: ChargeStatus.DISCONNECTED
    impl.is_wifi_enabled = lambda *a, **k: True
    impl.get_wifi_status = lambda *a, **k: WifiStatus.GOOD
    # Connected, so it has an address: the WiFi row and About show it (`basic_settings_menu.py:180`).
    impl.get_ip_addr_text = lambda *a, **k: '192.168.1.42'
    orig_init(impl)
Device.init = staticmethod(init)
from controller.controller import Controller
from controller.controller_inputs import ControllerInput as CI
from display.display import Display

LETTERS = {'u': CI.DPAD_UP, 'd': CI.DPAD_DOWN, 'l': CI.DPAD_LEFT, 'r': CI.DPAD_RIGHT, 'a': CI.A, 'b': CI.B,
           'x': CI.X, 'y': CI.Y, 'q': CI.L1, 'w': CI.R1, '1': CI.L2, '2': CI.R2, 's': CI.START, 'e': CI.SELECT,
           'm': CI.MENU}
queue = [LETTERS[c] for c in EVENTS]
last = {}

def capture():
    """The frame as drawn. Most devices draw into an ARGB1555 canvas; a device whose display is
    initialised twice (the Miyoo Minis) loses the canvas at the second init and draws straight to
    the window, so the window is read instead."""
    from devices.device import Device
    r = Display.renderer.sdlrenderer
    canvas = Display.render_canvas
    w, h = Device.get_device().screen_width(), Device.get_device().screen_height()
    if canvas:
        cw, ch = ctypes.c_int(), ctypes.c_int()
        if sdl2.SDL_QueryTexture(canvas, None, None, cw, ch) != 0:
            return
        w, h = cw.value, ch.value
    buf = (ctypes.c_uint8 * (w * h * 4))()
    sdl2.SDL_SetRenderTarget(r, canvas)
    rect = sdl2.SDL_Rect(0, 0, w, h)
    if sdl2.SDL_RenderReadPixels(r, rect, sdl2.SDL_PIXELFORMAT_ABGR8888, buf, w * 4) != 0:
        return
    last['frame'] = (w, h, bytes(buf))
    last['source'] = 'canvas' if canvas else 'window'

orig_present = Display.present.__func__
def present(cls, fade=False):
    orig_present(cls, False)
    capture()
Display.present = classmethod(present)

# Every image PyUI loads, when $IMAGE_LOG names a file, so the port's asset list is the launcher's own.
if os.environ.get('IMAGE_LOG'):
    orig_image_load = Display.image_load.__func__
    def image_load(cls, image_path):
        with open(os.environ['IMAGE_LOG'], 'a') as f:
            f.write(image_path + '\n')
        return orig_image_load(cls, image_path)
    Display.image_load = classmethod(image_load)

def get_input(timeout=-2, called_from_check_for_hotkey=False):
    if called_from_check_for_hotkey:
        return False
    if queue:
        Controller.last_controller_input = queue.pop(0)
        Controller.last_input_time = time.monotonic()
        return True
    from PIL import Image
    w, h, data = last['frame']
    Image.frombytes('RGBA', (w, h), data).convert('RGB').save(OUT)
    print('saved', OUT, w, h, last['source'])
    sys.stdout.flush()
    os._exit(0)
Controller.get_input = staticmethod(get_input)

# Every view PyUI builds, when $VIEW_LOG names a file: its title, type and rows, one JSON line each,
# so the port's labels, descriptions and values are PyUI's own rather than transcribed.
if os.environ.get('VIEW_LOG'):
    import json
    from views.view_creator import ViewCreator
    orig_create_view = ViewCreator.create_view
    def create_view(view_type, options, top_bar_text, *a, **k):
        def row(o):
            icon = o.get_icon() if hasattr(o, 'get_icon') else None
            return {'text': o.get_primary_text(), 'description': o.get_description(),
                    'value': o.get_value_text(), 'icon': icon if isinstance(icon, str) else None,
                    'image': o.get_image_path()}
        with open(os.environ['VIEW_LOG'], 'a') as f:
            f.write(json.dumps({'still': Path(OUT).stem, 'title': top_bar_text, 'type': getattr(view_type, 'name', str(view_type)),
                                'selected': k.get('selected_index', a[0] if a else None),
                                'rows': [row(o) for o in options]}) + '\n')
        return orig_create_view(view_type, options, top_bar_text, *a, **k)
    ViewCreator.create_view = staticmethod(create_view)

def background():
    mainui.background_startup()
mainui.start_background_threads = background

sys.argv = ['mainui.py', '-device', DEVICE, '-logDir', '/tmp/pyui-logs',
            '-pyUiConfig', str(CARD / 'App/PyUI/py-ui-config.json'),
            '-cfwConfig', str(CARD / 'Saves/spruce/spruce-config.json')]
mainui.main()
