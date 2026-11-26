'use client';

import Link from 'next/link';
import { BookOpen, LogOut, ArrowLeft, Printer, UserCheck } from 'lucide-react';
import { signOutAction } from '@/app/sign-in/actions';
import { Button } from '@/components/ui/button';
import type { AdminUser } from '@/lib/auth';

interface AppNavbarProps {
  admin: AdminUser;
  backHref?: string;
  backLabel?: string;
  subjectTitle?: string;
  subjectSubtitle?: string;
  printHref?: string;
}

export function AppNavbar({
  admin,
  backHref,
  backLabel,
  subjectTitle,
  subjectSubtitle,
  printHref,
}: AppNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/75 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {backHref ? (
            <Link href={backHref}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{backLabel || 'সকল বিষয়'}</span>
              </Button>
            </Link>
          ) : null}

          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00684A] text-white shadow-xs transition-transform group-hover:scale-[1.03]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                  {subjectTitle || 'BMT Guide Boi'}
                </span>
                {!subjectTitle && (
                  <span className="hidden sm:inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-[#00684A] dark:text-emerald-300">
                    HSC BMT
                  </span>
                )}
              </div>
              {subjectSubtitle ? (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {subjectSubtitle}
                </p>
              ) : null}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {printHref ? (
            <Link href={printHref}>
              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#00684A] hover:bg-[#00553D] text-white text-xs font-semibold px-3.5 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                প্রিন্ট / PDF
              </Button>
            </Link>
          ) : null}

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300">
            <UserCheck className="h-3.5 w-3.5 text-[#00684A] dark:text-emerald-400" />
            <span className="font-medium text-slate-800 dark:text-zinc-200 max-w-[130px] truncate">
              {admin.name}
            </span>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              size="sm"
              className="h-9 rounded-lg bg-[#00684A] hover:bg-[#00553D] text-white text-xs font-semibold px-3.5 shadow-xs"
            >
              <span className="hidden sm:inline mr-1.5">সাইন আউট</span>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
