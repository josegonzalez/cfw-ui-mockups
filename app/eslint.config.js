import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

/*
 * The `no-restricted-syntax` block on src/widgets/** enforces portability rules 1 and 4 from
 * docs/portability.md: a widget declares what it looks like and how it moves, and never
 * reaches for the DOM to do it. Imperative work belongs in the renderer adapter (src/anim/
 * waapi.ts) or in device chrome, both of which are exempt.
 *
 * This matters because the widgets are meant to be re-implementable by a renderer that has no
 * DOM at all. Every escape hatch used here becomes something that cannot be translated.
 */
const noImperativeDom = [
  {
    selector: "CallExpression > MemberExpression[property.name='animate']",
    message:
      'Widgets must not call element.animate(). Declare motion as an animation descriptor and let the renderer adapter play it.',
  },
  {
    selector: "CallExpression > MemberExpression[property.name='setProperty']",
    message:
      'Widgets must not write CSS custom properties. Pass resolved values as props (portability rule 3).',
  },
  {
    selector: "MemberExpression[property.name='classList']",
    message: 'Widgets must not mutate classList. Derive className from props.',
  },
  {
    selector: "AssignmentExpression > MemberExpression[property.name='innerHTML']",
    message: 'Widgets must not set innerHTML. Render children instead.',
  },
  {
    selector:
      "CallExpression > MemberExpression[property.name=/^(appendChild|removeChild|insertBefore|replaceChild)$/]",
    message: 'Widgets must not mutate the DOM tree directly. Render it.',
  },
  {
    selector: "CallExpression > MemberExpression[property.name=/^(querySelector|querySelectorAll)$/]",
    message: 'Widgets must not query the DOM. Pass what they need as props.',
  },
  {
    selector: "AssignmentExpression > MemberExpression[object.property.name='style']",
    message:
      'Widgets must not assign to element.style. Return a style object from props-derived geometry.',
  },
]

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    ignores: ['src/widgets/**/*.{test,spec,stories}.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...noImperativeDom],
    },
  },
)
