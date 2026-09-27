import type { Button } from '../../input/keymap'
import type { Platform } from './library'

/**
 * First run: `SetupWizard` (`lib/widgets/setup_wizard.dart`), shown by `PermissionCheckWrapper` until
 * setup completes, and the scan splash the Systems tab shows while a scan runs
 * (`lib/screens/systems_screen/system_content.dart:110-240`).
 */

export type WizardStep = 'userData' | 'permissions' | 'rom' | 'scan' | 'esde' | 'art'

/** Six steps on Android, five elsewhere: only Android asks for permissions (`setup_wizard.dart:95-108`). */
export function wizardSteps(platform: Platform): WizardStep[] {
  return platform === 'android'
    ? ['userData', 'permissions', 'rom', 'scan', 'esde', 'art']
    : ['userData', 'rom', 'scan', 'esde', 'art']
}

export interface WizardState {
  readonly step: number
  /** All Files Access (Android). Neither device has a second screen, so it is the only grant. */
  readonly storage: boolean
  /** A ROM folder was picked, rather than skipped. */
  readonly romFolder: boolean
  /** The scan's progress, 0 to 1; the Next button only works at 1. */
  readonly scan: number
  /** The ES-DE import has run. */
  readonly esde: boolean
}

export const INITIAL_WIZARD: WizardState = { step: 0, storage: false, romFolder: false, scan: 0, esde: false }

/**
 * Where a posed scan rests: part way, so the still shows the counting bar. The live build's clock
 * finishes it.
 */
export const SCAN_POSE = 0.4

/** The platform default user-data folder (`lib/services/config_service.dart:195-241`). */
export function userDataPath(platform: Platform): string {
  // Android: the app's external files directory. Linux: an AppImage keeps it under $HOME, and the
  // Linux handheld runs as root.
  return platform === 'android'
    ? '/storage/emulated/0/Android/data/com.neogamelab.neostation/files/user-data'
    : '/root/.neostation/user-data'
}

/** One button. Returns null once setup is finished (`setup_wizard.dart:160-315`, `:1853-1955`). */
export function reduceWizard(w: WizardState, platform: Platform, button: Button): WizardState | null {
  const steps = wizardSteps(platform)
  const step = steps[w.step]!
  const next = (by = 1): WizardState => ({ ...w, step: w.step + by })
  // Picking or skipping the ROM folder both start the scan.
  const toScan = (romFolder: boolean): WizardState => ({ ...w, step: steps.indexOf('scan'), romFolder, scan: SCAN_POSE })
  if (button === 'a') {
    switch (step) {
      case 'userData':
        // Android steps over Permissions when everything is already granted.
        return steps[w.step + 1] === 'permissions' && w.storage ? next(2) : next()
      case 'permissions':
        // The source opens the system's All Files screen and re-checks on return; here it is granted.
        return w.storage ? next() : { ...w, storage: true }
      case 'rom':
        return toScan(true)
      case 'scan':
        return w.scan >= 1 ? next() : w
      case 'esde':
        return w.esde ? next() : { ...w, esde: true }
      case 'art':
        // No pack catalogue offline, so the button reads Finish and completes setup.
        return null
    }
  }
  if (button === 'b') {
    switch (step) {
      case 'permissions':
        return next()
      case 'rom':
        // B skips on every platform, though only Android draws the Skip pill (`:289-302`, `:1755-1759`).
        return toScan(false)
      case 'esde':
        return next()
      case 'art':
        return null
      default:
        return w
    }
  }
  return w
}

/** The live build's clock: the scan completes. */
export const scanDone = (w: WizardState): WizardState => ({ ...w, scan: 1 })
