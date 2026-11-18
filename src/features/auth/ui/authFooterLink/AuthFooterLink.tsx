import { TextLink } from '@/features/auth/ui/textLink/TextLink';

type AuthFooterLinkProps = Readonly<{
  question: string;
  linkText: string;
  href: string;
}>;

export function AuthFooterLink({
  question,
  linkText,
  href,
}: AuthFooterLinkProps) {
  return (
    <p className="text-base text-typography-700">
      {question} <TextLink href={href}>{linkText}</TextLink>
    </p>
  );
}
