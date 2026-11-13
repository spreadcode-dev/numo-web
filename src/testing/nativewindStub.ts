// Stand-in for `nativewind` in unit tests (aliased in vitest.config.ts).
// Its runtime ships JSX that only an app bundler compiles, and its job, turning
// `className` into styles, can't be observed in jsdom anyway: unit tests check
// structure and roles, while `yarn test:e2e` checks real styling.
export function cssInterop(): void {}

export function vars<T>(variables: T): T {
  return variables;
}

export function useColorScheme() {
  return { colorScheme: 'light' as const, setColorScheme: () => {} };
}
