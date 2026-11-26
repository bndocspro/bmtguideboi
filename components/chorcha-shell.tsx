'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  BookOpenCheck,
  Calculator,
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  Menu,
  PanelLeft,
  Printer,
  Sigma,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { signOutAction } from '@/app/sign-in/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { toBanglaDigits } from '@/lib/subjects';
import type { AdminUser } from '@/lib/auth';

interface ChorchaShellProps {
  admin: AdminUser;
  breadcrumbs: Array<{ label: string; href?: string }>;
  stats?: {
    totalSubjects?: number;
    totalChapters?: number;
    totalItems?: number;
  };
  printHref?: string;
  activeClassTab?: 'all' | '11' | '12';
  onSelectClassTab?: (tab: 'all' | '11' | '12') => void;
  children: ReactNode;
}

export function ChorchaShell({
  admin,
  breadcrumbs,
  stats,
  printHref,
  activeClassTab,
  onSelectClassTab,
  children,
}: ChorchaShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: 'ড্যাশবোর্ড',
      href: '/',
      Icon: Home,
      iconColor: 'text-amber-500',
      active: pathname === '/' && (!activeClassTab || activeClassTab === 'all'),
      onClick: onSelectClassTab ? () => onSelectClassTab('all') : undefined,
    },
    {
      label: 'সকল গাইড (২৫)',
      href: '/',
      Icon: Layers,
      iconColor: 'text-orange-500',
      active: false,
      onClick: onSelectClassTab ? () => onSelectClassTab('all') : undefined,
    },
    {
      label: '১ম বর্ষ (একাদশ)',
      href: '/?class=11',
      Icon: GraduationCap,
      iconColor: 'text-sky-600',
      active: pathname === '/' && activeClassTab === '11',
      onClick: onSelectClassTab ? () => onSelectClassTab('11') : undefined,
    },
    {
      label: '২য় বর্ষ (দ্বাদশ)',
      href: '/?class=12',
      Icon: BookOpenCheck,
      iconColor: 'text-rose-500',
      active: pathname === '/' && activeClassTab === '12',
      onClick: onSelectClassTab ? () => onSelectClassTab('12') : undefined,
    },
    {
      label: 'বাংলা-২ গাইড',
      href: '/subjects/class-12-bangla-2',
      Icon: Sparkles,
      iconColor: 'text-indigo-600',
      active: pathname === '/subjects/class-12-bangla-2',
    },
    {
      label: 'ব্যবসায় গণিত',
      href: '/subjects/class-11-business-math-stat',
      Icon: Sigma,
      iconColor: 'text-violet-600',
      active: pathname === '/subjects/class-11-business-math-stat',
    },
    {
      label: 'হিসাববিজ্ঞান-১',
      href: '/subjects/class-11-accounting-1',
      Icon: Calculator,
      iconColor: 'text-emerald-600',
      active: pathname === '/subjects/class-11-accounting-1',
    },
    {
      label: 'হিসাববিজ্ঞান-২',
      href: '/subjects/class-12-accounting-2',
      Icon: FileSpreadsheet,
      iconColor: 'text-teal-600',
      active: pathname === '/subjects/class-12-accounting-2',
    },
  ];

  const SidebarBody = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-zinc-950 select-none">
      <div className="space-y-4 p-3.5">
        {/* Sidebar Top Brand Row */}
        <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 dark:bg-[#00684A] text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            {!collapsed && (
              <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                বিএমটি ২০২৬
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700"
            title={collapsed ? 'সাইডবার বড় করুন' : 'সাইডবার ছোট করুন'}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
              item.active
                ? 'bg-[#E8F5EF] dark:bg-emerald-950/60 text-[#00593D] dark:text-emerald-300 font-semibold'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/75 dark:hover:bg-zinc-900'
            }`;

            if (item.onClick && pathname === '/') {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left ${cls}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.Icon className={`h-4.5 w-4.5 shrink-0 ${item.iconColor}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cls}
                title={collapsed ? item.label : undefined}
              >
                <item.Icon className={`h-4.5 w-4.5 shrink-0 ${item.iconColor}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Card */}
      <div className="p-3.5">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between gap-2'
          } rounded-2xl border border-slate-200/85 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-2xs`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00684A] dark:text-emerald-300 font-bold text-sm">
              {admin.name.slice(0, 1).toUpperCase()}
              <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white leading-tight">
                Admin
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {admin.name}
                </p>
                <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 truncate">
                  HSC BMT
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <form action={signOutAction}>
              <button
                type="submit"
                title="সাইন আউট"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-slate-200/75 dark:border-zinc-800 sticky top-0 h-screen transition-all duration-200 ${
          collapsed ? 'w-[74px]' : 'w-[244px]'
        }`}
      >
        {SidebarBody}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-[250px] h-full border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Breadcrumb & Status Pills Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-slate-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="মেনু খুলুন"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] min-w-0">
              {breadcrumbs.map((b, idx) => (
                <div key={idx} className="flex items-center gap-1.5 min-w-0">
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 truncate"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {b.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {stats?.totalChapters !== undefined && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                <Layers className="h-3 w-3 text-slate-400" />
                {toBanglaDigits(stats.totalChapters)} অধ্যায়
              </span>
            )}
            {stats?.totalItems !== undefined && (
              <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {toBanglaDigits(stats.totalItems)} প্রশ্ন
              </span>
            )}
            {printHref && (
              <Link href={printHref}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00684A] hover:bg-[#00553D] text-white px-3 py-1.5 text-[11px] font-semibold transition-colors">
                  <Printer className="h-3 w-3" />
                  প্রিন্ট PDF
                </span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
