import { act, renderHook } from '@testing-library/react';
import { useUserMenu } from './useUserMenu';

describe('useUserMenu', () => {
  it('should run the sign-out when asked to sign out', async () => {
    const onSignOut = vi.fn<() => Promise<void>>().mockResolvedValue();
    const { result } = renderHook(() => useUserMenu(onSignOut));

    await act(async () => result.current.signOut());

    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
