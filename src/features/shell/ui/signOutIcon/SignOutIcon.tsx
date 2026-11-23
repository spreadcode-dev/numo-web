import { createIcon } from '@/components/ui/icon';

// gluestack ships no sign-out icon: this is the design's (a door and an arrow
// leaving it). It takes its color from the `text-*` class, like gluestack's.
export const SignOutIcon = createIcon({
  viewBox: '0 0 18 18',
  path: (
    <path
      d="M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 5.5 15.5 9 12 12.5M15.5 9h-8"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
});
