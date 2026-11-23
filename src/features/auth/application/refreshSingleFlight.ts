import type { RefreshOutcome } from '@/features/auth/domain/session';

export type RefreshSession = (refreshToken: string) => Promise<RefreshOutcome>;

type RefreshSingleFlightOptions = Readonly<{
  refresh: RefreshSession;
  now: () => Date;
}>;

type Flight = Readonly<{
  outcome: Promise<RefreshOutcome>;
  startedAt: number;
}>;

// Long enough for requests that left the browser with the old cookie (other
// tabs, prefetches) to still get the new session instead of reusing the old
// token, which numo-api treats as theft and answers by ending the session.
const REMEMBER_REFRESHED_MS = 30 * 1000;

// In memory: correct for one web server process only.
export function createRefreshSingleFlight({
  refresh,
  now,
}: RefreshSingleFlightOptions): RefreshSession {
  const flights = new Map<string, Flight>();

  function forget(refreshToken: string, flight: Flight): void {
    if (flights.get(refreshToken) === flight) flights.delete(refreshToken);
  }

  function start(refreshToken: string): Flight {
    const flight = {
      outcome: refresh(refreshToken),
      startedAt: now().getTime(),
    };
    flights.set(refreshToken, flight);
    void flight.outcome.then(
      (outcome) => {
        if (outcome.kind !== 'refreshed') forget(refreshToken, flight);
      },
      () => forget(refreshToken, flight),
    );
    return flight;
  }

  return (refreshToken) => {
    forgetStale(flights, now().getTime() - REMEMBER_REFRESHED_MS);
    return (flights.get(refreshToken) ?? start(refreshToken)).outcome;
  };
}

function forgetStale(flights: Map<string, Flight>, oldestKept: number): void {
  for (const [refreshToken, flight] of flights) {
    if (flight.startedAt < oldestKept) flights.delete(refreshToken);
  }
}
