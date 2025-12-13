import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { Providers } from './providers';
import '../index.css';
import { Toasters } from '@/components/toasters';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'EventHub',
  description: 'Event Management Made Simple',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.variable}>
        <Providers>
          {children}
          <Toasters />
        </Providers>
      </body>
    </html>
  );
}
