import { describe, expect, it } from 'vitest'
import { BUTTONS, BUTTON_KEY_LABEL, KEY_TO_BUTTON, buttonForKeyEvent } from './keymap'
import { CHROME_KEYS } from './chromeKeys'

const key = (k: string, code = '') => ({ key: k, code })

describe('buttonForKeyEvent', () => {
  it('maps the d-pad to the arrow keys', () => {
    expect(buttonForKeyEvent(key('ArrowUp'))).toBe('up')
    expect(buttonForKeyEvent(key('ArrowDown'))).toBe('down')
    expect(buttonForKeyEvent(key('ArrowLeft'))).toBe('left')
    expect(buttonForKeyEvent(key('ArrowRight'))).toBe('right')
  })

  it('maps the face buttons in the Nintendo layout these devices use', () => {
    expect(buttonForKeyEvent(key('z'))).toBe('a')
    expect(buttonForKeyEvent(key('x'))).toBe('b')
    expect(buttonForKeyEvent(key('a'))).toBe('x')
    expect(buttonForKeyEvent(key('s'))).toBe('y')
  })

  it('accepts either case, so holding shift does not break a face button', () => {
    for (const [lower, upper] of [
      ['z', 'Z'],
      ['x', 'X'],
      ['a', 'A'],
      ['s', 'S'],
      ['q', 'Q'],
      ['w', 'W'],
    ]) {
      expect(buttonForKeyEvent(key(upper!))).toBe(buttonForKeyEvent(key(lower!)))
    }
  })

  it('resolves select from the code, because both shifts report the same key', () => {
    expect(buttonForKeyEvent(key('Shift', 'ShiftRight'))).toBe('select')
    expect(buttonForKeyEvent(key('Shift', 'ShiftLeft'))).toBeNull()
  })

  it('maps the remaining buttons', () => {
    expect(buttonForKeyEvent(key('Enter'))).toBe('start')
    expect(buttonForKeyEvent(key('Escape'))).toBe('menu')
    expect(buttonForKeyEvent(key('q'))).toBe('l')
    expect(buttonForKeyEvent(key('w'))).toBe('r')
    expect(buttonForKeyEvent(key('Backspace'))).toBe('b')
  })

  it('returns null for anything unbound', () => {
    expect(buttonForKeyEvent(key('k'))).toBeNull()
    expect(buttonForKeyEvent(key('F5'))).toBeNull()
  })
})

describe('the key map as a whole', () => {
  it('binds every button except select, which is code-matched', () => {
    const bound = new Set<string>(Object.values(KEY_TO_BUTTON))
    bound.add('select')
    expect([...BUTTONS].sort()).toEqual([...bound].sort())
  })

  it('labels every button', () => {
    for (const button of BUTTONS) {
      expect(BUTTON_KEY_LABEL[button]).toBeTruthy()
    }
  })

  it('keeps the mockup-only keys disjoint from the device keys', () => {
    // The whole point of the punctuation bindings is that they can never be mistaken for a
    // device button. If the two tables ever overlap, that guarantee is gone.
    for (const chromeKey of Object.keys(CHROME_KEYS)) {
      expect(KEY_TO_BUTTON[chromeKey]).toBeUndefined()
    }
  })
})
