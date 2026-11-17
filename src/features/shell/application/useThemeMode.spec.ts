import { act, renderHook } from '@testing-library/react';
import { useThemeMode } from './useThemeMode';
import { THEME_STORAGE_KEY } from './themeStorage';

describe('useThemeMode', () => {
  afterEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('should start with the theme already on <html>', () => {
    document.documentElement.classList.add('dark');

    const { result } = renderHook(() => useThemeMode());

    expect(result.current.theme).toBe('dark');
  });

  it('should start light when <html> has no dark class', () => {
    const { result } = renderHook(() => useThemeMode());

    expect(result.current.theme).toBe('light');
  });

  it('should switch the theme and remember the choice', () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
