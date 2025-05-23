import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using Geist Sans only as per user's file, Geist_Mono removed
import './globals.css';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { PortfolioProvider } from '@/contexts/PortfolioContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Golden Years Portfolio',
  description: 'Personalized investment strategies for retirees.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        <PortfolioProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
          <Toaster />
        </PortfolioProvider>
      </body>
    </html>
  );
}
