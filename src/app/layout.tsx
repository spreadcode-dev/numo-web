import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import StyledJsxRegistry from './registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'NuMo',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StyledJsxRegistry>
          <GluestackUIProvider>{children}</GluestackUIProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
