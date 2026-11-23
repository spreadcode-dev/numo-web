import { refreshSessionIfNeeded } from '@/features/auth/infrastructure/sessionProxy';
import { config, proxy } from './proxy';

vi.mock('@/features/auth/infrastructure/sessionProxy');

describe('proxy', () => {
  it('should renew the session before the page renders', () => {
    expect(proxy).toBe(refreshSessionIfNeeded);
  });

  it('should run only for the protected area', () => {
    expect(config.matcher).toBe('/app/:path*');
  });
});
