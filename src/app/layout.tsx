import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeModeProvider } from '@/features/shell/ui/themeModeProvider/ThemeModeProvider';
import { ThemeScript } from '@/features/shell/ui/themeScript/ThemeScript';
import StyledJsxRegistry from './registry';
import './globals.css';

const brandFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'NuMo',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning: ThemeScript sets the theme class on <html>
    // before React hydrates, on purpose. It applies to <html> only.
    <html lang="en" className={brandFont.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background-0 text-typography-900">
        <StyledJsxRegistry>
          <ThemeModeProvider>{children}</ThemeModeProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
