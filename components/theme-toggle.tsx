'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('bmt_theme');
    const isDark = saved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const timer = window.setTimeout(() => setDark(isDark), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function applyTheme(nextDark: boolean) {
    setDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    window.localStorage.setItem('bmt_theme', nextDark ? 'dark' : 'light');
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100/80 dark:bg-zinc-900 p-0.5"
      role="group"
      aria-label="থিম পরিবর্তন"
    >
      <button
        type="button"
        onClick={() => applyTheme(false)}
        aria-label="লাইট মোড"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          !dark
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => applyTheme(true)}
        aria-label="ডার্ক মোড"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          dark
            ? 'bg-zinc-800 text-amber-300 shadow-xs'
            : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
