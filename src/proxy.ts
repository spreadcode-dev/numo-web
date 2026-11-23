import { refreshSessionIfNeeded } from '@/features/auth/infrastructure/sessionProxy';

export const proxy = refreshSessionIfNeeded;

// Only the protected area: the session is renewed where it's required.
export const config = {
  matcher: '/app/:path*',
};
