import type { Metadata } from 'next';
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'ByteVox — Show-Your-Work Report Builder',
  description:
    'Interactive reporting where every number proves its derivation. Profile messy CSVs, build block reports, and share read-only links with zero data leaks.',
  keywords: ['report builder', 'explainable analytics', 'show your work', 'CSV profiler', 'audit trail'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#080a0f] text-[#f1f3f7] selection:bg-[#e5a93c]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
