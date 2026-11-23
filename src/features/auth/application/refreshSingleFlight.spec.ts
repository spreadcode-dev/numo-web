import type { RefreshOutcome } from '@/features/auth/domain/session';
import {
  createRefreshSingleFlight,
  type RefreshSession,
} from './refreshSingleFlight';

const START = new Date('2026-11-22T12:00:00.000Z');
const SECONDS = 1000;
const REFRESHED: RefreshOutcome = {
  kind: 'refreshed',
  session: {
    accessToken: 'new-access',
    accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
    refreshToken: 'new-refresh',
    refreshTokenExpiresAt: new Date('2026-11-29T12:00:00.000Z'),
  },
};
const SESSION_ENDED: RefreshOutcome = { kind: 'sessionEnded' };

function setUp(refresh = vi.fn<RefreshSession>().mockResolvedValue(REFRESHED)) {
  let now = START;
  const refreshSingleFlight = createRefreshSingleFlight({
    refresh,
    now: () => now,
  });
  const waitSeconds = (seconds: number) => {
    now = new Date(now.getTime() + seconds * SECONDS);
  };
  return { refresh, refreshSingleFlight, waitSeconds };
}

describe('createRefreshSingleFlight', () => {
  it('should make one refresh for two concurrent calls with the same token', async () => {
    const { refresh, refreshSingleFlight } = setUp();

    const [first, second] = await Promise.all([
      refreshSingleFlight('old-refresh'),
      refreshSingleFlight('old-refresh'),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(first).toEqual(REFRESHED);
    expect(second).toBe(first);
  });

  it('should give the same new session to a call within 30 seconds', async () => {
    const { refresh, refreshSingleFlight, waitSeconds } = setUp();
    await refreshSingleFlight('old-refresh');
    waitSeconds(29);

    await expect(refreshSingleFlight('old-refresh')).resolves.toEqual(
      REFRESHED,
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('should refresh again once 30 seconds have passed', async () => {
    const { refresh, refreshSingleFlight, waitSeconds } = setUp();
    await refreshSingleFlight('old-refresh');
    waitSeconds(31);

    await refreshSingleFlight('old-refresh');

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('should refresh different tokens separately', async () => {
    const { refresh, refreshSingleFlight } = setUp();

    await Promise.all([
      refreshSingleFlight('refresh-a'),
      refreshSingleFlight('refresh-b'),
    ]);

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('should not remember a refresh that numo-api refused', async () => {
    const { refresh, refreshSingleFlight } = setUp(
      vi.fn<RefreshSession>().mockResolvedValue(SESSION_ENDED),
    );
    await refreshSingleFlight('old-refresh');

    await refreshSingleFlight('old-refresh');

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('should not remember a refresh that threw', async () => {
    const { refresh, refreshSingleFlight } = setUp(
      vi.fn<RefreshSession>().mockRejectedValue(new Error('boom')),
    );
    await expect(refreshSingleFlight('old-refresh')).rejects.toThrow('boom');

    await expect(refreshSingleFlight('old-refresh')).rejects.toThrow('boom');

    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
