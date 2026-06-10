import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ModelBench — Automated AI Judging & Hosting Hub',
  description:
    'Upload generated web projects, push them to GitHub, and let an impartial LLM judge rank every model on a live leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="relative z-10 container pb-32 pt-10">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#17130f',
              border: '1px solid #120f0a',
              color: '#fff7e6',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}
