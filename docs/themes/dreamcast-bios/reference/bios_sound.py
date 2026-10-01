"""Dreamcast BIOS sound extraction: the boot jingle and the menu sound effects.

Everything here is read out of the BIOS ROM (dc_boot.bin); nothing is taken from a rip.

Sound package
    The BIOS keeps its AICA payload at ROM 0x1a0000. At 0x1a0020 sits a table of
    little-endian (offset, size) u32 pairs, offsets relative to the table itself. The
    table has no count: it ends where the first blob it points at begins. The blobs are
    the sound driver (magic "SDRV"), a multi-unit file (magic "SMLT"), and two headerless
    blobs of 4-bit Yamaha ADPCM - the left and right halves of the boot jingle.

Boot jingle
    Plain AICA ADPCM (low nibble first), 44100 Hz, one blob per channel. The SH4 streams
    it straight to the AICA; it never touches the sequencer, so there is no reverb or
    envelope to model - the WAV is the dry stream.

SMLT (MIDI loader table, "multi unit")
    'SMLT', version u32, unit count u32, 0x14 bytes of 0xff; then 0x20-byte records:
    fourcc, bank u32, AICA address u32, AICA size u32, file offset u32, file size u32.
    File offsets are relative to the SMLT start, 0xffffffff means "reserve RAM only".
    The BIOS carries one SMPB (programs), one SMSB (sequences) and effect units
    (SFOB/SFPB/SFPW/SPSR) that only drive the DSP reverb.

SMPB (MIDI program bank) - layout from dakrk/manatools docs/mpb.hexpat and mpb.cpp
    Header: 'SMPB', version, file size, pad, then (ptr, count) for programs, velocity
    curves and two unknown tables. A program is 4 layer pointers (0 = unused layer). A
    layer is (split count u32, split ptr u32, delay u16, ?, bend hi/lo u8, ?). A split is
    0x30 bytes whose first 0x24 are nearly verbatim AICA channel registers:
        +00 u8  bank high bits (bit 7 set = 8-bit PCM)   +01 u8 flags (b0 ADPCM, b1 loop)
        +02 u16 tone ptr (low 16 bits, relative to SMPB) +04 u16 loop start +06 u16 loop end
        +08 u32 AEG: AR[4:0] D1R[10:6] D2R[15:11] RR[20:16] DL[25:21] KRS[29:26] LPSLNK[30]
        +0c u16 pitch: FNS[10:0] OCT[14:11] (signed 4-bit)
        +0e u16 LFO: ALFOS[2:0] ALFOWS[4:3] PLFOS[7:5] PLFOWS[9:8] LFOF[14:10] LFORE[15]
        +10 u8  DSP send (ISEL/IMXL)  +12 u8 pan  +13 u8 direct level (DISDL)
        +14 u8  Q[4:0] LPOFF[5] VOFF[6]  +15 u8 TL (attenuation, 0 = loudest)
        +16 u16 x5 filter levels FLV0..FLV4 (13-bit cutoff, 0x1ff8 = open)
        +20 u8  FD1R, FAR, FRR, FD2R
        +24 u8  start note, end note, base note, s8 fine tune, u16 ?, velocity curve id,
                velocity low, velocity high, drum mode, drum group, pad
    The tone plays at the pitch registers when keyed at its base note; other notes
    shift it by equal-tempered semitones.

SMSB (MIDI sequence bank) - layout from manatools docs/msb+msd.hexpat and msd.cpp
    'SMSB', version, file size, sequence count, then one u32 pointer per sequence to an
    SMSD. SMSD: 'SMSD', u32 TPQN code, u32 initial tempo (ms per quarter), then a
    big-endian event stream. MIDI-like, except a note carries its own gate (time until
    key-off) and step (time until the next event) instead of note-off and delta times:
        0x00-0x7f  note: low nibble channel, bits 4-6 pick the gate width
                   ((status >> 5) + 1 bytes) and step width (bit 4: 2 bytes, else 1);
                   followed by note, velocity, gate, step
        0x81 ref(u16 offset, u8 count)  0x82 loop  0x83 end  0x84 tempo(u16, u8 step)
        0x88-0x8b gate extend, 0x8c-0x8f step extend (added to the next event)
        0xb0 CC, 0xc0 program, 0xd0 pressure, 0xe0 bend: one data byte whose top bit
                   says the step that follows is u16 rather than u8
    Ticks per quarter note is 0x10000 / TPQN code (manatools' MIDI conversion).

Rendering
    menu_sounds() is a small software AICA: per voice it steps a 16-bit/8-bit/ADPCM tone
    with the AICA's (1024 | FNS) << OCT phase increment and linear interpolation, loops
    between LSA and LEA, and applies the bank's own amplitude envelope (AR/D1R/DL/D2R/RR
    with key-rate scaling), the resonant low-pass filter and its envelope (FLV0-4,
    FAR/FD1R/FD2R/FRR, Q), the amplitude LFO, TL and pan. The envelope and LFO arithmetic
    follows Flycast's core/hw/aica/sgc_if.cpp, the best-tested public model of the chip;
    the filter does not (see _filter_coefs).

    Deviations from hardware, all deliberate:
      * No DSP reverb. Every split sends to the DSP (FX level 9-15) and the BIOS loads an
        effect program (SFPB/SFPW) that is not run. The reference recording falls to
        digital silence within ~20 ms of each key-off, so any tail it adds is slight.
      * The filter's cutoff curve is calibrated against the recording, not emulated.
      * CC7 (volume) is applied as 40*log10(v/127) dB and CC10 (pan) is mapped linearly
        onto the AICA's 15-step pan; the driver's own tables are not reverse engineered.
        CC1 (modulation) scales the split's amplitude-LFO depth (see _Voice); the pitch
        LFO is not modelled because no split here uses it.
      * Velocity is ignored: the bank's only velocity curve is flat at 127.
      * An envelope rate of 0 means "hold" even under key-rate scaling. Flycast lets KRS
        lift a zero rate into motion; the AICA documentation describes 0 as stopped.
      * One tick is (initial tempo ms) / (0x10000 / TPQN code); tempo events retime.
"""

import math
import struct

PACKAGE = 0x1a0000
PACKAGE_TABLE = PACKAGE + 0x20
RATE = 44100
# Headroom in AICA attenuation steps (0.375 dB each). The driver's master volume is not
# modelled, and five full-level voices of a chord sum past 16 bits; -6 dB keeps every
# sequence in this bank below clipping without changing their relative levels.
MASTER_ATT = 16


# --------------------------------------------------------------------------- WAV / ADPCM

def _wav(channels, rate=RATE):
    """Interleave equal-length int lists into a 16-bit PCM WAV."""
    n = len(channels[0])
    frames = bytearray()
    for i in range(n):
        for ch in channels:
            frames += struct.pack('<h', max(-32768, min(32767, int(ch[i]))))
    nch = len(channels)
    fmt = struct.pack('<HHIIHH', 1, nch, rate, rate * nch * 2, nch * 2, 16)
    return (b'RIFF' + struct.pack('<I', 36 + len(frames)) + b'WAVE'
            + b'fmt ' + struct.pack('<I', 16) + fmt
            + b'data' + struct.pack('<I', len(frames)) + bytes(frames))


_ADPCM_QS = (0x0e6, 0x0e6, 0x0e6, 0x0e6, 0x133, 0x199, 0x200, 0x266)


def _adpcm(buf):
    """Yamaha AICA 4-bit ADPCM, as Flycast and MAME decode it (low nibble first)."""
    out = []
    prev, q = 0, 0x7f
    for b in buf:
        for n in (b & 0xf, b >> 4):
            d = (q * ((n & 7) * 2 + 1)) >> 3
            prev = prev - d if n & 8 else prev + d
            prev = max(-32768, min(32767, prev))
            q = max(0x7f, min(0x6000, (q * _ADPCM_QS[n & 7]) >> 8))
            out.append(prev)
    return out


# --------------------------------------------------------------------------- package

def _package(rom):
    """The (offset, size) table at 0x1a0020, as absolute ROM slices."""
    first = struct.unpack_from('<I', rom, PACKAGE_TABLE)[0]
    blobs = []
    for i in range(first // 8):
        off, size = struct.unpack_from('<II', rom, PACKAGE_TABLE + 8 * i)
        blobs.append(rom[PACKAGE_TABLE + off:PACKAGE_TABLE + off + size])
    return blobs


def boot_sound(rom):
    """The boot jingle: the two headerless ADPCM blobs, decoded as left and right."""
    # The driver and the SMLT announce themselves; the jingle halves are the blobs that
    # do not, in table order.
    streams = [b for b in _package(rom) if b[:4] not in (b'SDRV', b'SMLT')]
    left, right = streams[:2]
    return _wav([_adpcm(left), _adpcm(right)])


def _units(rom):
    mlt = next(b for b in _package(rom) if b[:4] == b'SMLT')
    count = struct.unpack_from('<I', mlt, 8)[0]
    units = {}
    for i in range(count):
        tag, _bank, _aica, _asize, off, size = struct.unpack_from('<4sIIIII', mlt, 0x20 + 0x20 * i)
        if off != 0xffffffff and tag not in units:
            units[tag] = mlt[off:off + size]
    return units


# --------------------------------------------------------------------------- SMPB

def _split(bank, o):
    jump, flags, ptr, lsa, lea, aeg, pitch, lfo = struct.unpack_from('<BBHHHIHH', bank, o)
    isel, _, pan, disdl, filt, tl = struct.unpack_from('<6B', bank, o + 0x10)
    flv = struct.unpack_from('<5H', bank, o + 0x16)
    fd1r, far, frr, fd2r, lo, hi, base, fine = struct.unpack_from('<7Bb', bank, o + 0x20)
    vlo, vhi = bank[o + 0x2b], bank[o + 0x2c]
    oct_ = (pitch >> 11) & 0xf
    fmt = 'adpcm' if flags & 1 else ('pcm8' if jump & 0x80 else 'pcm16')
    start = ptr + ((jump & 0x7f) << 16)
    # LEA doubles as the tone length (manatools); one extra sample covers interpolation.
    if fmt == 'pcm16':
        tone = list(struct.unpack_from('<%dh' % (lea + 1), bank, start))
    elif fmt == 'pcm8':
        tone = [((v ^ 0x80) - 0x80) << 8 for v in bank[start:start + lea + 1]]
    else:
        tone = _adpcm(bank[start:start + (lea + 2) // 2])
    return {
        'tone': tone, 'loop': bool(flags & 2), 'lsa': lsa, 'lea': lea,
        'ar': aeg & 31, 'd1r': (aeg >> 6) & 31, 'd2r': (aeg >> 11) & 31,
        'rr': (aeg >> 16) & 31, 'dl': (aeg >> 21) & 31, 'krs': (aeg >> 26) & 15,
        'lpslnk': (aeg >> 30) & 1,
        'fns': pitch & 0x7ff, 'oct': oct_ - 16 if oct_ & 8 else oct_,
        'alfos': lfo & 7, 'alfows': (lfo >> 3) & 3, 'lfof': (lfo >> 10) & 31,
        'lfore': lfo >> 15,
        'pan': -(pan & 0xf) if pan & 0x10 else pan & 0xf, 'disdl': disdl & 15,
        'q': filt & 31, 'lpoff': (filt >> 5) & 1, 'voff': (filt >> 6) & 1, 'tl': tl,
        'flv': flv, 'far': far, 'fd1r': fd1r, 'fd2r': fd2r, 'frr': frr,
        'lo': lo, 'hi': hi, 'base': base, 'fine': fine, 'vlo': vlo, 'vhi': vhi,
    }


def _programs(bank):
    assert bank[:4] == b'SMPB'
    ptr, count = struct.unpack_from('<II', bank, 0x10)
    programs = []
    for p in range(count):
        prog = struct.unpack_from('<I', bank, ptr + 4 * p)[0]
        layers = []
        for lp in struct.unpack_from('<4I', bank, prog):
            if not lp:
                continue
            nsplit, sp = struct.unpack_from('<II', bank, lp)
            layers.append([_split(bank, sp + 0x30 * s) for s in range(nsplit)])
        programs.append(layers)
    return programs


# --------------------------------------------------------------------------- SMSB

def _sequences(seqbank):
    """Each SMSD as a time-ordered list of (ms, kind, channel, a, b) events."""
    assert seqbank[:4] == b'SMSB'
    count = struct.unpack_from('<I', seqbank, 12)[0]
    ptrs = struct.unpack_from('<%dI' % count, seqbank, 16)
    return [_sequence(seqbank, p) for p in ptrs]


def _sequence(d, o):
    assert d[o:o + 4] == b'SMSD'
    tpqn, tempo = struct.unpack_from('<II', d, o + 4)
    ticks_per_quarter = 0x10000 / tpqn
    events = []
    state = {'ms': 0.0, 'tempo': tempo, 'gext': 0, 'sext': 0}

    def var(i, flag):
        if flag & 0x80:
            return struct.unpack_from('>H', d, i)[0], i + 2
        return d[i], i + 1

    def advance(step):
        state['ms'] += (step + state['sext']) * state['tempo'] / ticks_per_quarter
        state['sext'] = 0

    def run(i, limit=None):
        # Returns the position after the stream (or after `limit` messages, for 0x81).
        n = 0
        while limit is None or n < limit:
            s = d[i]
            if s < 0x80:
                ch, note, vel = s & 0xf, d[i + 1], d[i + 2]
                i += 3
                gate = 0
                for _ in range((s >> 5) + 1):
                    gate, i = (gate << 8) | d[i], i + 1
                step, i = var(i, 0x80 if s & 0x10 else 0)
                ms_per_tick = state['tempo'] / ticks_per_quarter
                events.append((state['ms'], 'note', ch, note, vel,
                               (gate + state['gext']) * ms_per_tick))
                state['gext'] = 0
                advance(step)
            elif s == 0x83:
                return i + 1, True
            elif s == 0x84:
                state['tempo'] = struct.unpack_from('>H', d, i + 1)[0]
                i += 4
                advance(d[i - 1])
            elif s == 0x81:
                off, cnt = struct.unpack_from('>HB', d, i + 1)
                run(o + off, cnt)
                i += 4
            elif s == 0x82:
                step, i = var(i + 2, d[i + 1])
                advance(step)
            elif 0x88 <= s <= 0x8b:
                state['gext'] += (0x200, 0x800, 0x1000, 0x2000)[s & 3]
                i += 1
                continue  # extends are not counted as messages
            elif 0x8c <= s <= 0x8f:
                state['sext'] += (0x100, 0x200, 0x800, 0x1000)[s & 3]
                i += 1
                continue
            elif s & 0xf0 == 0xb0:
                cc, val = d[i + 1], d[i + 2]
                step, i = var(i + 3, cc)
                events.append((state['ms'], 'cc', s & 0xf, cc & 0x7f, val, 0))
                advance(step)
            elif s & 0xf0 in (0xc0, 0xd0, 0xe0):
                val = d[i + 1]
                step, i = var(i + 2, val)
                if s & 0xf0 == 0xc0:
                    events.append((state['ms'], 'prog', s & 0xf, val & 0x7f, 0, 0))
                advance(step)
            elif s == 0xf0:
                step, size = d[i + 1], d[i + 2]
                _, i = var(i + 3 + size, step)
                advance(step)
            else:
                raise ValueError('unknown SMSD status 0x%02x at 0x%x' % (s, i))
            n += 1
        return i, False

    run(o + 12)
    return events


# --------------------------------------------------------------------------- AICA voice

_ATTACK_MS = (
    -1, -1, 8100.0, 6900.0, 6000.0, 4800.0, 4000.0, 3400.0, 3000.0, 2400.0, 2000.0, 1700.0,
    1500.0, 1200.0, 1000.0, 860.0, 760.0, 600.0, 500.0, 430.0, 380.0, 300.0, 250.0, 220.0,
    190.0, 150.0, 130.0, 110.0, 95.0, 76.0, 63.0, 55.0, 47.0, 38.0, 31.0, 27.0, 24.0, 19.0,
    15.0, 13.0, 12.0, 9.4, 7.9, 6.8, 6.0, 4.7, 3.8, 3.4, 3.0, 2.4, 2.0, 1.8, 1.6, 1.3, 1.1,
    0.93, 0.85, 0.65, 0.53, 0.44, 0.40, 0.35, 0.0, 0.0)
_DSR_MS = (
    -1, -1, 118200.0, 101300.0, 88600.0, 70900.0, 59100.0, 50700.0, 44300.0, 35500.0,
    29600.0, 25300.0, 22200.0, 17700.0, 14800.0, 12700.0, 11100.0, 8900.0, 7400.0, 6300.0,
    5500.0, 4400.0, 3700.0, 3200.0, 2800.0, 2200.0, 1800.0, 1600.0, 1400.0, 1100.0, 920.0,
    790.0, 690.0, 550.0, 460.0, 390.0, 340.0, 270.0, 230.0, 200.0, 170.0, 140.0, 110.0, 98.0,
    85.0, 68.0, 57.0, 49.0, 43.0, 34.0, 28.0, 25.0, 22.0, 18.0, 14.0, 12.0, 11.0, 8.5, 7.1,
    6.1, 5.4, 4.3, 3.6, 3.1)
# Q register -> resonance feedback, in 1/4096ths (Flycast qtable)
_QTABLE = (2048, 1536, 1024, 512, 0, -256, -512, -768, -1024, -1280, -1536, -1792, -2048,
           -2176, -2304, -2432, -2560, -2688, -2816, -2944, -3072, -3136, -3200, -3264,
           -3328, -3392, -3456, -3520, -3584, -3648, -3712, -3776)
# DISDL / pan step -> attenuation in 1/16-octave (0.375 dB) units
_SEND = (255,) + tuple((15 - i) << 3 for i in range(1, 16))


def _dsr_step(eff):
    """Envelope units (0..1023) moved per sample at an effective rate."""
    ms = _DSR_MS[eff]
    if ms < 0:
        return 0.0
    return 1024.0 if ms == 0 else 1024.0 / (44.1 * ms)


def _attack_keep(eff):
    """Per-sample multiplier on the attack's remaining attenuation (0x280 -> 0)."""
    ms = _ATTACK_MS[eff]
    if ms < 0:
        return 1.0
    if ms == 0:
        return 0.0
    return 1.0 / 0x280 ** (1.0 / (44.1 * ms))


_FILTER_CACHE = {}


def _filter_coefs(fv, q):
    """Biquad low-pass for 13-bit cutoff level fv and resonance register value q.

    The cutoff mapping is calibrated, not emulated. Flycast's formula puts an octave in
    every 512 FLV steps, which spans 15 octaves and parks FLV 306-1871 (this bank's
    sustain levels) below 1 Hz: the cursor sound would go silent 80 ms in. The recording
    keeps a tail about 20 dB down that fades with the amplitude envelope until key-off.
    An octave per 1024 steps, fully open at 0x1ff8, reproduces that tail. Q follows
    Flycast's damping table (Q=4 flat, lower damped, higher resonant) around a
    Butterworth response.
    """
    key = (fv, q)
    if key not in _FILTER_CACHE:
        cutoff = min(0.45 * RATE, RATE / 2.0 * 2.0 ** ((fv - 0x1ff8) / 1024.0))
        w = 2 * math.pi * cutoff / RATE
        alpha = math.sin(w) * (1 + _QTABLE[q] / 4096.0) / math.sqrt(2)
        c = math.cos(w)
        a0 = 1 + alpha
        _FILTER_CACHE[key] = ((1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0,
                              -2 * c / a0, (1 - alpha) / a0)
    return _FILTER_CACHE[key]


class _Voice:
    def __init__(self, sp, note, key_on, key_off, att_extra, pan, mod):
        self.sp = sp
        self.key_on = key_on
        self.key_off = key_off
        # Keyed at its base note the tone plays at its pitch registers; every semitone
        # away multiplies the phase increment by 2^(1/12). manatools reads the s8 fine
        # tune as roughly +-48 cents; it is zero throughout this bank.
        ratio = (2.0 ** sp['oct'] * (1024 + sp['fns']) / 1024
                 * 2.0 ** ((note - sp['base'] + sp['fine'] / 256.0) / 12.0))
        self.inc = ratio
        oct_ = math.floor(math.log2(ratio))
        fns = min(0x3ff, int(round((ratio / 2.0 ** oct_ - 1) * 1024)))

        def eff(rate):
            # Key-rate scaling makes higher notes run their envelopes faster.
            if rate == 0:
                return 0
            e = rate * 2
            if sp['krs'] < 15:
                e += (fns >> 9) & 1
                e += max(0, (sp['krs'] + oct_) * 2)
            return min(e, 63)

        self.att_keep = _attack_keep(eff(sp['ar']))
        self.d1 = _dsr_step(eff(sp['d1r']))
        self.d2 = _dsr_step(eff(sp['d2r']))
        self.rr = _dsr_step(eff(sp['rr']))
        self.dl = sp['dl'] << 5
        self.feg_rates = [_dsr_step(eff(r)) for r in (sp['far'], sp['fd1r'], sp['fd2r'], sp['frr'])]
        self.filter = not sp['lpoff'] and (min(sp['flv']) < 0x1ff8 or sp['q'] != 4)
        # Static attenuation: TL + direct send + channel volume; pan is added per side.
        base = (0 if sp['voff'] else sp['tl']) + _SEND[sp['disdl']] + att_extra + MASTER_ATT
        pan = max(-15, min(15, pan + sp['pan']))
        side = _SEND[15 - abs(pan)]
        self.att_l = base + (side if pan > 0 else 0)
        self.att_r = base + (side if pan < 0 else 0)
        # The bank's LFO depth is the ceiling the modulation wheel opens up to. The
        # recording settles it: seq 5's program carries a full-depth saw tremolo, and the
        # memory-card dialog it plays on has none - seq 5 never sends CC1. Seq 3 sends
        # CC1=127 and keeps its square tremolo.
        self.alfos = int(round(sp['alfos'] * mod / 127.0))
        # LFO period in samples per state step (Flycast UpdateLFO)
        n = sp['lfof']
        g = 128 >> (n >> 2)
        self.lfo_period = (g - 1) * 4 + g * ((~n & 3) + 1)

    def render(self, out_l, out_r):
        sp = self.sp
        tone, loop, lsa, lea = sp['tone'], sp['loop'], sp['lsa'], sp['lea']
        pos = 0.0
        aeg, state = float(0x280), 0          # 0 attack, 1 decay1, 2 decay2, 3 release
        fstate, fval = 0, float(sp['flv'][0])
        z1 = z2 = 0.0
        lfo_state, lfo_count = 0, self.lfo_period
        alfo_shift = 8 - self.alfos
        n_out = len(out_l)
        t = self.key_on
        while t < n_out:
            if state != 3 and t >= self.key_off:
                state, fstate = 3, 3
            # sample fetch with the AICA's linear interpolation
            i = int(pos)
            frac = pos - i
            s = tone[i] * (1 - frac) + tone[min(i + 1, len(tone) - 1)] * frac
            s *= 16
            if self.filter:
                b0, b1, b2, a1, a2 = _filter_coefs(int(fval), sp['q'])
                y = b0 * s + z1
                z1 = b1 * s - a1 * y + z2
                z2 = b2 * s - a2 * y
                s = y
            if sp['voff']:
                ofs = 0
            else:
                wave = (lfo_state if sp['alfows'] == 0 else
                        (255 if lfo_state & 0x80 else 0) if sp['alfows'] == 1 else
                        ((lfo_state & 0x7f) ^ (0x7f if lfo_state & 0x80 else 0)) << 1
                        if sp['alfows'] == 2 else
                        (lfo_state * 0x41c64e6d + 0x3039) & 0xff)
                ofs = min(255, (wave >> alfo_shift) + (int(aeg) >> 2))
            lim = 255 - ofs
            out_l[t] += s / 16 * 2.0 ** (-(ofs + min(self.att_l, lim)) / 16.0)
            out_r[t] += s / 16 * 2.0 ** (-(ofs + min(self.att_r, lim)) / 16.0)
            # amplitude envelope, in attenuation units (0 loud, 0x3ff silent)
            if state == 0:
                aeg *= self.att_keep
                if aeg < 1:
                    aeg, state = 0.0, 0 if sp['lpslnk'] else 1
            elif state == 1:
                aeg += self.d1
                if aeg >= self.dl:
                    state = 2
            elif state == 2:
                aeg = min(0x3ff, aeg + self.d2)
            else:
                aeg += self.rr
                if aeg >= 0x3ff:
                    return t
            if sp['lpslnk'] and state == 0 and pos >= lsa:
                state = 1
            # filter envelope: FLV0 -> FLV1 (attack) -> FLV2 -> FLV3, release -> FLV4
            if self.filter:
                target = sp['flv'][fstate + 1]
                rate = self.feg_rates[fstate]
                if fval < target:
                    fval = min(target, fval + rate)
                elif fval > target:
                    fval = max(target, fval - rate)
                elif fstate < 2:
                    fstate += 1
            lfo_count -= 1
            if lfo_count == 0:
                lfo_state, lfo_count = (lfo_state + 1) & 0xff, self.lfo_period
            pos += self.inc
            if pos >= lea:
                if not loop:
                    return t
                pos = lsa + (pos - lea) % max(1, lea - lsa)
            t += 1
        return t


def _render(events, programs, rate=RATE):
    prog = {}
    vol = {}
    pan = {}
    mod = {}
    voices = []
    for ms, kind, ch, a, b, gate in events:
        if kind == 'prog':
            prog[ch] = a
        elif kind == 'cc' and a == 7:
            vol[ch] = b
        elif kind == 'cc' and a == 10:
            pan[ch] = b
        elif kind == 'cc' and a == 1:
            mod[ch] = b
        elif kind == 'note':
            v = vol.get(ch, 127)
            att = 255 if v == 0 else int(round(-40 * math.log10(v / 127.0) / 0.375))
            p = int(round((pan.get(ch, 64) - 64) / 64.0 * 15))
            on = int(round(ms * rate / 1000))
            off = on + int(round(gate * rate / 1000))
            for layer in programs[prog.get(ch, 0)]:
                for sp in layer:
                    if sp['lo'] <= a <= sp['hi'] and sp['vlo'] <= b <= sp['vhi']:
                        voices.append(_Voice(sp, a, on, off, att, p, mod.get(ch, 0)))
    # Longest possible tail: the latest key-off plus a full-scale release, capped at 4 s.
    end = max(v.key_off for v in voices)
    n = end + int(rate * 4)
    out_l, out_r = [0.0] * n, [0.0] * n
    last = 0
    for v in voices:
        last = max(last, v.render(out_l, out_r))
    # A closed filter leaves voices keyed but inaudible; stop where the sound does.
    last = max(i for i in range(min(last, n - 1) + 1) if abs(out_l[i]) >= 1 or abs(out_r[i]) >= 1)
    return [int(round(x)) for x in out_l[:last + 1]], [int(round(x)) for x in out_r[:last + 1]]


def menu_sounds(rom):
    """Every SMSB sequence rendered through the SMPB programs, as stereo WAVs by index."""
    units = _units(rom)
    programs = _programs(units[b'SMPB'])
    return {i: _wav(list(_render(ev, programs)))
            for i, ev in enumerate(_sequences(units[b'SMSB']))}


if __name__ == '__main__':
    import sys
    rom = open(sys.argv[1], 'rb').read()
    out = sys.argv[2] if len(sys.argv) > 2 else '.'
    open(out + '/boot.wav', 'wb').write(boot_sound(rom))
    for i, wav in menu_sounds(rom).items():
        open('%s/seq%d.wav' % (out, i), 'wb').write(wav)
