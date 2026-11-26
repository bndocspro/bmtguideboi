'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardList,
  Cpu,
  FileSpreadsheet,
  Globe,
  Landmark,
  Languages,
  Laptop,
  Megaphone,
  Printer,
  Search,
  ShoppingBag,
  Sigma,
  Users,
} from 'lucide-react';
import { ChorchaShell } from '@/components/chorcha-shell';
import { Input } from '@/components/ui/input';
import { toBanglaDigits } from '@/lib/subjects';
import type { AdminUser } from '@/lib/auth';
import type { SubjectRecord } from '@/lib/types';

interface DashboardClientProps {
  admin: AdminUser;
  subjects: SubjectRecord[];
  initialClassFilter?: 'all' | '11' | '12';
}

function getSubjectVisual(slug: string) {
  if (slug.includes('bangla')) {
    return { Icon: BookOpen, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' };
  }
  if (slug.includes('english')) {
    return { Icon: Languages, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' };
  }
  if (slug.includes('math')) {
    return { Icon: Sigma, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' };
  }
  if (slug.includes('computer-office')) {
    return { Icon: Laptop, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40' };
  }
  if (slug.includes('economics')) {
    return { Icon: Globe, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/40' };
  }
  if (slug.includes('computerized-accounting')) {
    return { Icon: FileSpreadsheet, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40' };
  }
  if (slug.includes('accounting')) {
    return { Icon: Calculator, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40' };
  }
  if (slug.includes('business-org')) {
    return { Icon: Briefcase, color: 'text-lime-600', bg: 'bg-lime-50 dark:bg-lime-950/40' };
  }
  if (slug.includes('office-management')) {
    return { Icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' };
  }
  if (slug.includes('e-business')) {
    return { Icon: ShoppingBag, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40' };
  }
  if (slug.includes('marketing')) {
    return { Icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' };
  }
  if (slug.includes('digital-tech')) {
    return { Icon: Cpu, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40' };
  }
  if (slug.includes('hrm')) {
    return { Icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' };
  }
  if (slug.includes('financial')) {
    return { Icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' };
  }
  return { Icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-zinc-800' };
}

export function DashboardClient({
  admin,
  subjects,
  initialClassFilter = 'all',
}: DashboardClientProps) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<'all' | '11' | '12'>(initialClassFilter);

  const stats = useMemo(() => {
    const totalChapters = subjects.reduce((acc, s) => acc + (s.chapter_count || 0), 0);
    const totalItems = subjects.reduce((acc, s) => acc + (s.item_count || 0), 0);
    return {
      totalSubjects: subjects.length,
      class11Count: subjects.filter((s) => s.class_year === 11).length,
      class12Count: subjects.filter((s) => s.class_year === 12).length,
      totalChapters,
      totalItems,
    };
  }, [subjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => {
      if (classFilter === '11' && s.class_year !== 11) return false;
      if (classFilter === '12' && s.class_year !== 12) return false;
      if (!q) return true;
      return (
        s.name_bn.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        s.subject_code.toLowerCase().includes(q) ||
        s.table_name.toLowerCase().includes(q)
      );
    });
  }, [subjects, search, classFilter]);

  const class11List = useMemo(() => filtered.filter((s) => s.class_year === 11), [filtered]);
  const class12List = useMemo(() => filtered.filter((s) => s.class_year === 12), [filtered]);

  return (
    <ChorchaShell
      admin={admin}
      breadcrumbs={[
        { label: 'ড্যাশবোর্ড' },
        {
          label:
            classFilter === '11'
              ? 'একাদশ শ্রেণি (১ম বর্ষ)'
              : classFilter === '12'
                ? 'দ্বাদশ শ্রেণি (২য় বর্ষ)'
                : 'সকল গাইড বই',
        },
      ]}
      stats={{
        totalSubjects: stats.totalSubjects,
        totalChapters: stats.totalChapters,
        totalItems: stats.totalItems,
      }}
      activeClassTab={classFilter}
      onSelectClassTab={setClassFilter}
    >
      <main className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 space-y-7">
        {/* Chorcha Centered Pill Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-slate-100/90 dark:bg-zinc-900 p-1 border border-slate-200/70 dark:border-zinc-800">
            {(
              [
                { id: 'all', label: `সকল বিষয় (${toBanglaDigits(stats.totalSubjects)})` },
                { id: '11', label: `১ম বর্ষ (${toBanglaDigits(stats.class11Count)})` },
                { id: '12', label: `২য় বর্ষ (${toBanglaDigits(stats.class12Count)})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setClassFilter(tab.id)}
                className={`rounded-full px-5 sm:px-7 py-2 text-xs sm:text-sm font-medium transition-all ${
                  classFilter === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Title & Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            টপিক / বিষয় সিলেক্ট করো
          </h1>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="বিষয় খুঁজুন..."
              className="pl-8 h-9 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs shadow-none focus-visible:ring-[#00684A]/20"
            />
          </div>
        </div>

        {/* Class 11 Grid */}
        {class11List.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                একাদশ শ্রেণি (১ম বর্ষ) — {toBanglaDigits(class11List.length)}টি
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {class11List.map((subject) => (
                <ChorchaSubjectCard key={subject.slug} subject={subject} />
              ))}
            </div>
          </section>
        )}

        {/* Class 12 Grid */}
        {class12List.length > 0 && (
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                দ্বাদশ শ্রেণি (২য় বর্ষ) — {toBanglaDigits(class12List.length)}টি
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {class12List.map((subject) => (
                <ChorchaSubjectCard key={subject.slug} subject={subject} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 py-14 text-center space-y-2">
            <p className="text-sm text-slate-500 dark:text-zinc-400">কোনো বিষয় পাওয়া যায়নি।</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setClassFilter('all');
              }}
              className="text-xs font-semibold text-[#00684A] hover:underline"
            >
              সব বিষয় দেখান
            </button>
          </div>
        )}
      </main>
    </ChorchaShell>
  );
}

function ChorchaSubjectCard({ subject }: { subject: SubjectRecord }) {
  const { Icon, color, bg } = getSubjectVisual(subject.slug);
  const chCount = subject.chapter_count || 0;
  const itemCount = subject.item_count || 0;
  const hasContent = chCount > 0 || itemCount > 0;
  const progressWidth = hasContent ? Math.min(100, Math.max(28, chCount * 8)) : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/85 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all duration-150 hover:border-emerald-500/45 dark:hover:border-emerald-600/50 hover:shadow-xs">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <Link
          href={`/subjects/${subject.slug}`}
          className="flex flex-1 items-center gap-3 min-w-0"
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#00684A] dark:group-hover:text-emerald-400 transition-colors truncate">
              {subject.name_bn}
            </p>
            {hasContent && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                {toBanglaDigits(chCount)} অধ্যায় • {toBanglaDigits(itemCount)} প্রশ্ন
              </p>
            )}
          </div>
        </Link>

        <Link
          href={`/subjects/${subject.slug}/view`}
          title={`${subject.name_bn} — প্রিন্ট ও PDF`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 dark:text-zinc-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 hover:text-[#00684A] dark:hover:text-emerald-400 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Chorcha-style Bottom Green Progress Accent Line */}
      {progressWidth > 0 && (
        <div className="h-[3px] w-full bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full bg-[#007A4D] dark:bg-emerald-500 transition-all"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}
