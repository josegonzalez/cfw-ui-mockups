/**
 * PORTING NOTES
 * CFW: SimpleOS            Devices: rg-ds
 * Source: boorngos/SimpleOS release zip - simpleos/system/splash/logo.bmp, logo2.bmp
 * Mode: reproduce
 *
 * Layout:        The two splash bitmaps SimpleOS ships, one per panel, drawn at 1:1. They are
 *                640x480 each, which is how the panel size is known.
 * Focus & selection: None.
 * Buttons:       The warning says "Touch the touch screen to continue." A tap on the bottom panel
 *                continues, and so do A and START, so the build can be driven from the keyboard.
 * Transitions:   None seen in the trailer: the splash cuts straight to home.
 * Notes:         Converted from BMP to PNG and otherwise untouched. The same two images are shown
 *                during install (`simpleos/install/splash/`, byte-identical).
 */
import { Panels } from '../../../device/Panels'
import logo from '../assets/splash/logo.png'
import logo2 from '../assets/splash/logo2.png'

const FULL = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '640px',
  height: '480px',
} as const

export function Boot({ onTouch }: { onTouch: () => void }) {
  return (
    <Panels
      top={<img src={logo} alt="SIMPLE OS - RG DS" style={FULL} />}
      bottom={
        <img
          src={logo2}
          alt="Warning. Touch the touch screen to continue."
          style={{ ...FULL, cursor: 'pointer' }}
          onClick={onTouch}
        />
      }
    />
  )
}
