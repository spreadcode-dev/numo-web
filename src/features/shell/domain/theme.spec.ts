import { isTheme, oppositeTheme, resolveInitialTheme } from './theme';

describe('resolveInitialTheme', () => {
  it.each([
    { stored: 'light', system: 'light', expected: 'light' },
    { stored: 'light', system: 'dark', expected: 'light' },
    { stored: 'dark', system: 'light', expected: 'dark' },
    { stored: 'dark', system: 'dark', expected: 'dark' },
    { stored: undefined, system: 'light', expected: 'light' },
    { stored: undefined, system: 'dark', expected: 'dark' },
  ] as const)(
    'should pick $expected when $stored is stored and the OS is $system',
    ({ stored, system, expected }) => {
      expect(resolveInitialTheme(stored, system)).toBe(expected);
    },
  );

  it('should ignore an unknown stored value and follow the OS', () => {
    expect(resolveInitialTheme('blue', 'dark')).toBe('dark');
  });
});

describe('isTheme', () => {
  it.each(['light', 'dark'])('should accept %s', (value) => {
    expect(isTheme(value)).toBe(true);
  });

  it.each(['', 'Dark', 'system', undefined])('should reject %s', (value) => {
    expect(isTheme(value)).toBe(false);
  });
});

describe('oppositeTheme', () => {
  it.each([
    { theme: 'light', expected: 'dark' },
    { theme: 'dark', expected: 'light' },
  ] as const)('should turn $theme into $expected', ({ theme, expected }) => {
    expect(oppositeTheme(theme)).toBe(expected);
  });
});
