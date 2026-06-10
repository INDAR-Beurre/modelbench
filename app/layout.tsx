import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'ModelBench — Automated AI Judging & Hosting Hub',
  description:
    'Upload web projects, push them to GitHub, and let an impartial LLM judge rank every model on a live leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="container pb-24 pt-8">{children}</main>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(240 6% 9%)',
              border: '1px solid hsl(240 4% 16%)',
              color: 'hsl(0 0% 98%)',
            },
          }}
        />
      </body>
    </html>
  );
}
