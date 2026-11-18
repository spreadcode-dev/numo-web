import { Alert, AlertText } from '@/components/ui/alert';

export function FormAlert({ message }: Readonly<{ message: string }>) {
  return (
    <Alert
      action="error"
      role="alert"
      className="items-start gap-2.5 rounded-lg px-3.5"
    >
      <ErrorMark />
      <AlertText size="sm" className="text-error-700">
        {message}
      </AlertText>
    </Alert>
  );
}

function ErrorMark() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="shrink-0 text-error-700"
    >
      <rect
        x="1.75"
        y="1.75"
        width="16.5"
        height="16.5"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7 7 L13 13 M13 7 L7 13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
