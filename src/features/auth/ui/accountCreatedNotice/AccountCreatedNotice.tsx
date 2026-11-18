import { Alert, AlertText } from '@/components/ui/alert';

// <output> is the native status region: screen readers announce it politely.
export function AccountCreatedNotice() {
  return (
    <output className="block">
      <Alert action="success" className="items-start gap-2.5 rounded-lg px-3.5">
        <CheckMark />
        <AlertText size="sm" className="text-success-700">
          <AlertText size="sm" className="font-semibold text-success-700">
            Account created.
          </AlertText>{' '}
          Sign in with your new email and password.
        </AlertText>
      </Alert>
    </output>
  );
}

function CheckMark() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="shrink-0 text-success-700"
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M6.5 10.2 L8.9 12.5 L13.5 7.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
