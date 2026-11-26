'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paginateBook } from '@/lib/paginator';
import { toBanglaDigits } from '@/lib/subjects';
import type { BookData, SubjectRecord } from '@/lib/types';

interface BookPrintViewerProps {
  subject: SubjectRecord;
  bookData: BookData;
  initialChapterId?: string;
}

const FONT_OPTIONS = [
  { label: 'কালপুরুষ (Kalpurush)', value: "'kalpurush', 'Purno', sans-serif" },
  { label: 'পূর্ণ (Purno)', value: "'Purno', 'kalpurush', sans-serif" },
  { label: 'শরীফ জনতা (ShorifJonota)', value: "'ShorifJonota', 'kalpurush', sans-serif" },
  { label: 'সোলাইমান লিপি (SolaimanLipi)', value: "'SolaimanLipi', 'kalpurush', sans-serif" },
  { label: 'নোটো সান্স (Noto Sans)', value: "'Noto Sans Bengali', sans-serif" },
];

const FONT_SIZE_OPTIONS = [
  { label: '৯.৫ pt (ছোট)', value: '9.5pt' },
  { label: '১০ pt (কমপ্যাক্ট)', value: '10pt' },
  { label: '১০.৩ pt (আদর্শ)', value: '10.3pt' },
  { label: '১০.৮ pt (মাঝারি)', value: '10.8pt' },
  { label: '১১.৪ pt (বড়)', value: '11.4pt' },
  { label: '১২ pt (খুব বড়)', value: '12pt' },
];

export function BookPrintViewer({
  subject,
  bookData,
  initialChapterId = 'all',
}: BookPrintViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chapterId, setChapterId] = useState(
    initialChapterId &&
      (initialChapterId === 'all' ||
        bookData.chapters.some((c) => c.id === initialChapterId))
      ? initialChapterId
      : bookData.chapters.length > 1
        ? 'all'
        : bookData.chapters[0]?.id || 'all'
  );
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>(
    bookData.defaultPageSize === 'a4' ? 'a4' : 'letter'
  );
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(subject.default_font_size || '10.3pt');
  const [startPage, setStartPage] = useState<number>(bookData.startPageNumber || 1);
  const [columnOverride, setColumnOverride] = useState<'auto' | '1' | '2'>('auto');
  const [includeBlankIntro, setIncludeBlankIntro] = useState(
    Boolean(bookData.includeBlankIntroPages)
  );
  const [pageCount, setPageCount] = useState<number>(0);
  const [rendering, setRendering] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // Sync dynamic @page CSS size for browser native Vector PDF export
  useEffect(() => {
    const styleId = 'bmt-dynamic-page-size-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @page {
        size: ${pageSize === 'a4' ? 'A4 portrait' : 'letter portrait'};
        margin: 0;
      }
    `;
  }, [pageSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    document.documentElement.style.setProperty('--book-font-family', fontFamily);
    document.documentElement.style.setProperty('--book-base-font-size', fontSize);

    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      setRendering(true);
      const total = await paginateBook(el, bookData, {
        chapterId,
        startPageNumber: startPage,
        includeBlankIntroPages: includeBlankIntro,
        columnOverride,
      });
      if (!cancelled) {
        setPageCount(total);
        setRendering(false);
      }
    }, 30);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [bookData, chapterId, pageSize, fontFamily, fontSize, startPage, includeBlankIntro, columnOverride]);

  return (
    <div
      className="book-view-root min-h-screen bg-[#e5e9f0]"
      data-page-size={pageSize}
    >
      {/* Print Control Toolbar (Automatically Hidden in PDF/Print) */}
      <nav
        className="no-print font-bangla-ui sticky top-0 z-50 bg-[#0f172a] text-slate-50 px-4 py-2.5 shadow-md"
        aria-label="গাইড বই প্রিন্ট কন্ট্রোল বার"
      >
        <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link href={`/subjects/${subject.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-slate-200 hover:text-white hover:bg-slate-800 text-xs"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                এডিটরে ফিরুন
              </Button>
            </Link>
            <span className="rounded bg-[#2563eb] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
              VECTOR PDF
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-[260px]">
              {subject.book_title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">অধ্যায়:</span>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 outline-none max-w-[210px]"
              >
                {bookData.chapters.length > 1 && (
                  <option value="all">
                    সকল অধ্যায় ({toBanglaDigits(bookData.chapters.length)}টি)
                  </option>
                )}
                {bookData.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    অধ্যায় {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">পেজ:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'a4' ? 'a4' : 'letter')}
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 outline-none"
              >
                <option value="letter">Letter (8.5×11 in)</option>
                <option value="a4">A4 (210×297 mm)</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">ফন্ট:</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">সাইজ:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 outline-none"
              >
                {FONT_SIZE_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">কলাম:</span>
              <select
                value={columnOverride}
                onChange={(e) =>
                  setColumnOverride(e.target.value as 'auto' | '1' | '2')
                }
                className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-0.5 outline-none"
              >
                <option value="auto">ডিফল্ট (সেকশন অনুযায়ী)</option>
                <option value="1">সর্বত্র ১ কলাম</option>
                <option value="2">সর্বত্র ২ কলাম</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1">
              <span className="text-slate-300">শুরু:</span>
              <input
                type="number"
                min={1}
                value={startPage}
                onChange={(e) => setStartPage(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 bg-slate-800 text-white border border-slate-600 rounded px-1.5 py-0.5 outline-none"
              />
            </label>

            <label className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBlankIntro}
                onChange={(e) => setIncludeBlankIntro(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-slate-200">খালি পৃষ্ঠা ১-২</span>
            </label>

            <span className="px-2 font-bold text-blue-300 flex items-center gap-1">
              {rendering && <RefreshCw className="h-3 w-3 animate-spin" />}
              মোট পৃষ্ঠা: {toBanglaDigits(pageCount)}
            </span>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowTips((v) => !v)}
              className="h-8 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs"
              title="হাই-কোয়ালিটি লো-সাইজ PDF সেভ করার নিয়ম"
            >
              <Info className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="h-8 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              প্রিন্ট / PDF সেভ করুন
            </Button>
          </div>
        </div>

        {showTips && (
          <div className="mx-auto max-w-[1440px] mt-2 rounded-lg border border-blue-500/30 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="text-blue-300">হাই-কোয়ালিটি ও লো-সাইজ ভেক্টর PDF টিপস:</strong>{' '}
              প্রিন্ট ডায়ালগে <strong>Destination: Save as PDF</strong>, <strong>Margins: None</strong> এবং{' '}
              <strong>Background graphics: Checked</strong> রাখুন। এতে সব বাংলা লেখা, টেবিল ও LaTeX সমীকরণ ১০০% ভেক্টর হিসেবে সেভ হবে এবং ফাইল সাইজ হবে খুবই কম।
            </div>
            <button
              type="button"
              onClick={() => setShowTips(false)}
              className="text-slate-400 hover:text-white underline"
            >
              বন্ধ করুন
            </button>
          </div>
        )}
      </nav>

      {/* Empty state if no chapters yet */}
      {bookData.chapters.length === 0 ? (
        <div className="no-print mx-auto max-w-lg my-16 rounded-2xl bg-white p-8 text-center shadow-sm space-y-3 font-bangla-ui">
          <h2 className="text-base font-bold text-slate-900">
            প্রিন্ট করার জন্য কোনো অধ্যায় বা প্রশ্ন নেই
          </h2>
          <p className="text-xs text-slate-500">
            প্রথমে এডিটরে গিয়ে অধ্যায় ও প্রশ্ন যুক্ত করুন, তারপর এখানে এসে প্রিন্ট বা ভেক্টর PDF তৈরি করুন।
          </p>
          <Link href={`/subjects/${subject.slug}`}>
            <Button size="sm" className="bg-[#001B5E] text-white text-xs">
              এডিটরে ফিরে যান
            </Button>
          </Link>
        </div>
      ) : (
        <main ref={containerRef} className="pages-container" aria-live="polite" />
      )}
    </div>
  );
}
