import Link from 'next/link';
import type { ReactNode } from 'react';

type TextLinkProps = Readonly<{ href: string; children: ReactNode }>;

export function TextLink({ href, children }: TextLinkProps) {
  return (
    <Link
      href={href}
      className="font-semibold text-primary-600 underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
