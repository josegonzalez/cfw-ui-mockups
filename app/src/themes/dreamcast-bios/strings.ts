/**
 * The BIOS's own English strings, as `docs/themes/dreamcast-bios/reference/extract-assets.py`
 * reads them out of the boot ROM into `reference/strings-en.txt`, kept byte for byte - including
 * the padding spaces that centre the menu labels and indent the Settings names.
 *
 * Two escapes survive from the ROM. `\x16` switches the text to yellow and `\x17` back; inside,
 * `\x01` followed by a number is one of the system font's Dreamcast icons (`dc/biosfont.h`): 11 is
 * the A button, 12 B, 15 X and 16 Y. `runs` splits a string on them.
 */
export const S = {
  pleaseWait: 'Please wait',
  checking: 'while disc is being checked.',
  insertDisc: 'Please insert game disc.',
  selectCard: 'Select a memory card and press \x16\x01\x0b Button\x17.',
  selectFiles: '  Select file(s) and press \x16\x01\x0b Button\x17.(\x16\x01\x0f/\x01\x10\x17',
  selectFiles2: 'to select multiple files of same game.)',
  selectDest: 'Select the destination memory card',
  selectDest2: 'and press \x16\x01\x0b Button\x17.',
  fileDeleted: 'File was deleted.',
  willDelete: 'This file will be deleted.',
  proceed: 'Do you wish to proceed?',
  deleteAll: 'All files will be permanently deleted',
  deleteAll2: 'from the memory card.',
  together: 'These files will be deleted together.',
  messages: 'Messages will be displayed',
  inLanguage: ['in Japanese.', 'in English.', 'in German.', 'in French.', 'in Spanish.', 'in Italian.'],
  setClock: 'Set Date/Time. L/R on the controller',
  setClock2: 'moves the cursor.',
  setClock3: 'U/D on the controller changes',
  setClock4: 'the settings.',
  stereo: "Select for 'Stereo'",
  mono: "Select for 'Mono'",
  audioOutput: 'audio output.',
  autoOn: 'The game automatically starts',
  autoOn2: 'when game disc is inserted.',
  autoOff: 'The game must be started by using the ',
  autoOff2: "'Play' icon after the game disc is inserted.",
  cardClock: 'Date/Time settings on all memory cards',
  cardClock2: 'will be adjusted to match those on the',
  cardClock3: "main console. 'Select' to proceed.",
  menu: ['    Play    ', '    File    ', '    Music   ', '  Settings  '],
  copy: 'Copy',
  delete: 'Delete',
  cancel: 'Cancel',
  yes: 'Yes',
  no: 'No',
  copyAll: 'Copy all',
  deleteAllItem: 'Delete all (memory reset)',
  select: 'Select',
  free: '    Free',
  settings: ['    Language', '  Date/Time', '       Sound', '       Other'],
  stereoItem: 'Stereo',
  monoItem: 'Mono',
  autoStartOn: "Auto start 'ON'",
  autoStartOff: "Auto start 'OFF'",
  adjustClock: 'Adjust the memory card(s) clock',
  blocks: 'block(s)',
  noFiles: 'No files found.',
  total: '       Total',
  currentClock: 'Current Date/Time of',
  currentClock2: 'main console',
  cardsSet: 'Set all memory cards to',
  cardsSet2: 'Date/Time of main console.',
} as const

/** The Language dialog's options, each in its own language, as the dialog lists them. */
export const LANGUAGE_NAMES = ['日本語', 'English', 'Deutsch', 'Français', 'Español', 'Italiano'] as const

export interface Run {
  readonly text: string
  readonly hot: boolean
}

/** The Private Use Area code point the rebuilt font gives Dreamcast icon `n`. */
export const icon = (n: number) => String.fromCharCode(0xe000 + n)

/** A string split where it turns yellow and back, with its icon escapes resolved to glyphs. */
export function runs(s: string): Run[] {
  const out: Run[] = []
  let hot = false
  let text = ''
  const flush = () => {
    if (text) out.push({ text, hot })
    text = ''
  }
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 0x16 || c === 0x17) {
      flush()
      hot = c === 0x16
    } else if (c === 0x01) {
      text += icon(s.charCodeAt(++i))
    } else {
      text += s[i]
    }
  }
  flush()
  return out
}

/** The number of 12-pixel cells a string takes: wide glyphs (icons, kanji) take two. */
export function cells(s: string): number {
  let n = 0
  for (const run of runs(s)) for (const ch of run.text) n += ch.charCodeAt(0) >= 0x3000 ? 2 : 1
  return n
}

/**
 * A save's comment as the BIOS shows it: the bytes read as ISO 8859-1, one cell each. A Japanese
 * comment is Shift-JIS, which the English menu does not decode - its lead bytes 0x80-0x9f have no
 * glyph and draw as nothing, and its trail bytes land on accented Latin letters
 * (`frames/file-list.png`, Puyo Puyo Fever's "Õ æ Õ æ t B [ o [").
 */
export function asLatin1(hex: string): string {
  let out = ''
  for (let i = 0; i < hex.length; i += 2) {
    const b = parseInt(hex.slice(i, i + 2), 16)
    out += b >= 0x80 && b < 0xa0 ? ' ' : String.fromCharCode(b)
  }
  return out
}
