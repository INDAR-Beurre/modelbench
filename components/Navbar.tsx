'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Trophy, UploadCloud, Settings, LayoutDashboard, Github } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: UploadCloud },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_0_20px_-2px_hsl(262_83%_60%/0.6)]">
            <span className="text-base font-black text-white">M</span>
            <span className="absolute -inset-px rounded-lg bg-gradient-to-br from-violet-500/0 to-cyan-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide">ModelBench</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              AI Judging & Hosting
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                  active && 'bg-secondary text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}
