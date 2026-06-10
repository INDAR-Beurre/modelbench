'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Trophy, UploadCloud, Github } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Index', icon: LayoutDashboard, num: '01' },
  { href: '/upload', label: 'Submit', icon: UploadCloud, num: '02' },
  { href: '/leaderboard', label: 'Rank', icon: Trophy, num: '03' },
  { href: '/settings', label: 'Keys', icon: Settings, num: '04' },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-4 z-40 pt-4">
      <div className="container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-full border border-ink bg-ink text-paper">
              <span className="font-serif text-lg font-black leading-none">M</span>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-red ring-2 ring-paper" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-base font-semibold tracking-tightest text-ink">
                ModelBench
              </span>
              <span className="eyebrow text-muted">Vol. 01 / 2026</span>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-1 rounded-pill border border-ink bg-paper/70 p-1 backdrop-blur-md">
            {NAV.map(({ href, label, icon: Icon, num }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-xs font-semibold uppercase tracking-eyebrow transition-all duration-300',
                    active
                      ? 'bg-ink text-paper'
                      : 'text-ink/70 hover:bg-cream hover:text-ink',
                  )}
                >
                  <span className="numeral text-[10px] opacity-60">{num}</span>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <a
            href="https://github.com/INDAR-Beurre/modelbench"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 self-start rounded-pill border border-ink bg-paper px-3.5 py-2 text-xs font-semibold uppercase tracking-eyebrow text-ink transition-colors hover:bg-ink hover:text-paper sm:self-auto"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>
    </header>
  );
}
