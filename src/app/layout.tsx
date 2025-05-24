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
  title: '황금빛 노후 포트폴리오',
  description: '은퇴자를 위한 맞춤형 투자 전략.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geistSans.variable}>
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
