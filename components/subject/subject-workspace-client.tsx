'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Columns2,
  Columns3,
  Copy,
  Download,
  Edit3,
  FileJson,
  FolderPlus,
  Loader2,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { ChorchaShell } from '@/components/chorcha-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RichText } from '@/components/rich-text';
import { QuestionEditorDialog } from '@/components/subject/question-editor-dialog';
import { SECTION_FORMATS, SECTION_FORMAT_MAP, toBanglaDigits } from '@/lib/subjects';
import type { AdminUser } from '@/lib/auth';
import type {
  BookData,
  CreativeSubAnswer,
  CreativeSubQuestion,
  GuideChapterSummary,
  GuideDbRow,
  McqOption,
  SectionType,
  SubjectRecord,
} from '@/lib/types';

interface SubjectWorkspaceClientProps {
  admin: AdminUser;
  subject: SubjectRecord;
  chapters: GuideChapterSummary[];
  items: GuideDbRow[];
  bookData: BookData;
}

export function SubjectWorkspaceClient({
  admin,
  subject: initialSubject,
  chapters: initialChapters,
  items: initialItems,
  bookData: initialBookData,
}: SubjectWorkspaceClientProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [chapters, setChapters] = useState(initialChapters);
  const [items, setItems] = useState(initialItems);
  const [bookData, setBookData] = useState(initialBookData);

  const [activeChapterKey, setActiveChapterKey] = useState<string>(
    initialChapters[0]?.chapter_key || ''
  );
  const [activeFormat, setActiveFormat] = useState<'all' | SectionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Chapter Dialog
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<GuideChapterSummary | null>(null);
  const [chNum, setChNum] = useState('');
  const [chTitle, setChTitle] = useState('');
  const [chAuthor, setChAuthor] = useState('');
  const [chPart, setChPart] = useState('');
  const [chSaving, setChSaving] = useState(false);

  // Question Editor Dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GuideDbRow | null>(null);
  const [defaultFormat, setDefaultFormat] = useState<SectionType>('knowledge');

  // Book Settings Dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState(initialSubject.book_title);
  const [rhTop, setRhTop] = useState(initialSubject.running_header_top);
  const [rhBanner, setRhBanner] = useState(initialSubject.running_header_banner);
  const [defaultPageSize, setDefaultPageSize] = useState<'letter' | 'a4'>(
    initialSubject.default_page_size === 'a4' ? 'a4' : 'letter'
  );
  const [startPage, setStartPage] = useState(initialSubject.start_page_number || 1);
  const [includeBlank, setIncludeBlank] = useState(Boolean(initialSubject.include_blank_intro_pages));
  const [savingSettings, setSavingSettings] = useState(false);

  // JSON Import/Export Dialog
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonReplace, setJsonReplace] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [jsonSaving, setJsonSaving] = useState(false);

  async function refreshSubjectData(selectKey?: string) {
    const res = await fetch(`/api/subjects/${subject.slug}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setSubject(data.subject);
    setChapters(data.chapters);
    setItems(data.items);
    setBookData(data.bookData);
    if (selectKey) {
      setActiveChapterKey(selectKey);
    } else if (
      data.chapters.length > 0 &&
      !data.chapters.some((c: GuideChapterSummary) => c.chapter_key === activeChapterKey)
    ) {
      setActiveChapterKey(data.chapters[0].chapter_key);
    }
    router.refresh();
  }

  const activeChapter = useMemo(
    () => chapters.find((c) => c.chapter_key === activeChapterKey) || null,
    [chapters, activeChapterKey]
  );

  const chapterItems = useMemo(
    () => items.filter((it) => it.chapter_key === activeChapterKey),
    [items, activeChapterKey]
  );

  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = { all: chapterItems.length };
    for (const it of chapterItems) {
      counts[it.section_type] = (counts[it.section_type] || 0) + 1;
    }
    return counts;
  }, [chapterItems]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chapterItems.filter((it) => {
      if (activeFormat !== 'all' && it.section_type !== activeFormat) return false;
      if (!q) return true;
      const serialized = JSON.stringify(it.content || {}).toLowerCase();
      return (
        serialized.includes(q) ||
        it.section_title.toLowerCase().includes(q) ||
        it.board_tag.toLowerCase().includes(q) ||
        it.item_number.toLowerCase().includes(q)
      );
    });
  }, [chapterItems, activeFormat, searchQuery]);

  const groupedSections = useMemo(() => {
    const groups = new Map<
      string,
      {
        sectionType: SectionType;
        sectionTitle: string;
        columns: 1 | 2;
        sectionOrder: number;
        items: GuideDbRow[];
      }
    >();
    for (const it of visibleItems) {
      const key = `${it.section_type}::${it.section_title}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          sectionType: it.section_type,
          sectionTitle: it.section_title || SECTION_FORMAT_MAP[it.section_type]?.labelBn || '',
          columns: it.columns === 2 ? 2 : 1,
          sectionOrder: it.section_order,
          items: [],
        };
        groups.set(key, g);
      }
      g.items.push(it);
    }
    return Array.from(groups.values()).sort((a, b) => a.sectionOrder - b.sectionOrder);
  }, [visibleItems]);

  function openNewChapterDialog() {
    setEditingChapter(null);
    setChNum(toBanglaDigits(chapters.length + 1));
    setChTitle('');
    setChAuthor('');
    setChPart('');
    setChapterDialogOpen(true);
  }

  function openEditChapterDialog(ch: GuideChapterSummary) {
    setEditingChapter(ch);
    setChNum(ch.chapter_number);
    setChTitle(ch.chapter_title);
    setChAuthor(ch.chapter_author);
    setChPart(ch.chapter_part);
    setChapterDialogOpen(true);
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!chTitle.trim()) return;
    setChSaving(true);
    try {
      if (editingChapter) {
        await fetch(
          `/api/subjects/${subject.slug}/chapters/${encodeURIComponent(editingChapter.chapter_key)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chapter_number: chNum,
              chapter_title: chTitle,
              chapter_author: chAuthor,
              chapter_part: chPart,
            }),
          }
        );
        await refreshSubjectData(editingChapter.chapter_key);
      } else {
        const res = await fetch(`/api/subjects/${subject.slug}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapter_number: chNum,
            chapter_title: chTitle,
            chapter_author: chAuthor,
            chapter_part: chPart,
          }),
        });
        const data = await res.json();
        await refreshSubjectData(data.chapter?.chapter_key);
      }
      setChapterDialogOpen(false);
    } finally {
      setChSaving(false);
    }
  }

  async function handleDeleteChapter(ch: GuideChapterSummary) {
    if (
      !window.confirm(
        `আপনি কি "${ch.chapter_title}" অধ্যায়টি এবং এর ভেতরের সকল প্রশ্ন মুছে ফেলতে চান?`
      )
    ) {
      return;
    }
    await fetch(
      `/api/subjects/${subject.slug}/chapters/${encodeURIComponent(ch.chapter_key)}`,
      { method: 'DELETE' }
    );
    await refreshSubjectData();
  }

  function openNewItem(format?: SectionType) {
    const fmt = format || (activeFormat === 'all' ? 'knowledge' : activeFormat);
    setEditingItem(null);
    setDefaultFormat(fmt);
    setEditorOpen(true);
  }

  async function handleDeleteItem(item: GuideDbRow) {
    if (!window.confirm('এই প্রশ্ন / কনটেন্টটি মুছে ফেলতে চান?')) return;
    await fetch(`/api/subjects/${subject.slug}/items/${item.id}`, {
      method: 'DELETE',
    });
    await refreshSubjectData();
  }

  async function handleDuplicateItem(item: GuideDbRow) {
    await fetch(`/api/subjects/${subject.slug}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapter_key: item.chapter_key,
        section_type: item.section_type,
        section_title: item.section_title,
        header_svg: item.header_svg,
        columns: item.columns,
        board_tag: item.board_tag,
        content: item.content,
      }),
    });
    await refreshSubjectData();
  }

  async function handleToggleSectionColumns(sectionType: SectionType, nextCols: 1 | 2) {
    if (!activeChapterKey) return;
    await fetch(
      `/api/subjects/${subject.slug}/items/${items[0]?.id || '00000000-0000-0000-0000-000000000000'}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_section_columns',
          chapter_key: activeChapterKey,
          section_type: sectionType,
          columns: nextCols,
        }),
      }
    );
    await refreshSubjectData();
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await fetch(`/api/subjects/${subject.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_title: bookTitle,
          running_header_top: rhTop,
          running_header_banner: rhBanner,
          default_page_size: defaultPageSize,
          start_page_number: startPage,
          include_blank_intro_pages: includeBlank,
        }),
      });
      await refreshSubjectData();
      setSettingsOpen(false);
    } finally {
      setSavingSettings(false);
    }
  }

  function handleOpenJsonModal() {
    setJsonError('');
    setJsonText(JSON.stringify(bookData, null, 2));
    setJsonReplace(false);
    setJsonOpen(true);
  }

  function handleDownloadJson() {
    const blob = new Blob([jsonText || JSON.stringify(bookData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportJson() {
    setJsonError('');
    let parsed: BookData;
    try {
      parsed = JSON.parse(jsonText);
      if (!parsed || !Array.isArray(parsed.chapters)) {
        setJsonError('JSON-এ অবশ্যই "chapters" অ্যারে থাকতে হবে।');
        return;
      }
    } catch (err) {
      setJsonError('JSON সিনট্যাক্স ত্রুটি: ' + (err as Error).message);
      return;
    }

    setJsonSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subject.slug}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookData: parsed, replace: jsonReplace }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJsonError(data.error || 'ইমপোর্ট ব্যর্থ হয়েছে।');
        return;
      }
      await refreshSubjectData();
      setJsonOpen(false);
    } finally {
      setJsonSaving(false);
    }
  }

  const nextNumberHint = toBanglaDigits(
    (activeFormat === 'all'
      ? chapterItems.filter((i) => i.section_type === 'knowledge').length
      : chapterItems.filter((i) => i.section_type === activeFormat).length) + 1
  );

  return (
    <ChorchaShell
      admin={admin}
      breadcrumbs={[
        { label: 'ড্যাশবোর্ড', href: '/' },
        { label: subject.name_bn },
        ...(activeChapter ? [{ label: activeChapter.chapter_title }] : []),
      ]}
      stats={{
        totalChapters: chapters.length,
        totalItems: items.length,
      }}
      printHref={`/subjects/${subject.slug}/view${
        activeChapter ? `?chapter=${encodeURIComponent(activeChapter.chapter_key)}` : ''
      }`}
    >
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-6 pb-24">
        {/* Chorcha-style Centered Subject Header */}
        <div className="relative flex items-center justify-center py-1">
          <Link
            href="/"
            className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900"
            title="সব বিষয়ে ফিরুন"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>

          <div className="text-center space-y-0.5 px-10">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">
              {subject.name_bn}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              অধ্যায় {toBanglaDigits(chapters.length)}টি • প্রশ্ন {toBanglaDigits(items.length)}টি •{' '}
              <span className="font-mono text-[11px]">{subject.table_name}</span>
            </p>
          </div>

          <div className="absolute right-0 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500"
              onClick={() => setSettingsOpen(true)}
              title="বই প্রিন্ট ও হেডার সেটিংস"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500"
              onClick={handleOpenJsonModal}
              title="JSON ইমপোর্ট / এক্সপোর্ট"
            >
              <FileJson className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chapter Pills Strip */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
              অধ্যায় নির্বাচন করুন
            </span>
            <Button
              type="button"
              size="sm"
              onClick={openNewChapterDialog}
              className="h-7 rounded-full bg-[#00684A] hover:bg-[#00553D] text-white text-[11px] px-3"
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              নতুন অধ্যায়
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-slate-500">এই বিষয়ে এখনো কোনো অধ্যায় যুক্ত হয়নি।</p>
              <Button
                size="sm"
                onClick={openNewChapterDialog}
                className="h-8 rounded-full bg-[#00684A] hover:bg-[#00553D] text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                প্রথম অধ্যায় তৈরি করুন
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {chapters.map((ch) => {
                const isActive = ch.chapter_key === activeChapterKey;
                return (
                  <div
                    key={ch.chapter_key}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#00684A] bg-[#E8F5EF] dark:bg-emerald-950/70 text-[#00593D] dark:text-emerald-300 font-semibold'
                        : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveChapterKey(ch.chapter_key)}
                  >
                    <span>
                      {ch.chapter_number}. {ch.chapter_title}
                    </span>
                    <span className="text-[10px] opacity-70">
                      ({toBanglaDigits(ch.item_count)})
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChapterDialog(ch);
                          }}
                          className="p-0.5 rounded hover:bg-white/80 text-slate-500 hover:text-slate-900"
                          title="অধ্যায় সম্পাদনা"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(ch);
                          }}
                          className="p-0.5 rounded hover:bg-white/80 text-slate-400 hover:text-red-600"
                          title="অধ্যায় মুছুন"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Chapter Body */}
        {activeChapter && (
          <div className="space-y-5">
            {/* Active Chapter Title & Filter Toolbar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-center sm:text-left">
                  <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {activeChapter.chapter_title} ({toBanglaDigits(chapterItems.length)})
                  </h2>
                  {activeChapter.chapter_author && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {activeChapter.chapter_author}
                      {activeChapter.chapter_part ? ` • ${activeChapter.chapter_part}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="প্রশ্ন খুঁজুন..."
                      className="pl-8 h-8 rounded-full text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openNewItem()}
                    className="h-8 rounded-full bg-[#00684A] hover:bg-[#00553D] text-white text-xs px-3.5"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    প্রশ্ন যুক্ত করুন
                  </Button>
                  <Link
                    href={`/subjects/${subject.slug}/view?chapter=${encodeURIComponent(
                      activeChapter.chapter_key
                    )}`}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-xs border-slate-200 dark:border-zinc-700"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      প্রিন্ট PDF
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Format Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFormat('all')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeFormat === 'all'
                      ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
                >
                  সকল ({toBanglaDigits(formatCounts.all || 0)})
                </button>
                {SECTION_FORMATS.map((fmt) => {
                  const cnt = formatCounts[fmt.type] || 0;
                  const active = activeFormat === fmt.type;
                  return (
                    <button
                      key={fmt.type}
                      type="button"
                      onClick={() => setActiveFormat(fmt.type)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#00684A] text-white'
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {fmt.shortLabelBn} ({toBanglaDigits(cnt)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Groups (Chorcha Screenshot 2 Clean Bounded Cards) */}
            {groupedSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 py-14 text-center space-y-3">
                <BookOpen className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm text-slate-500">এই অধ্যায়ে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি।</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {(['knowledge', 'comprehension', 'creative', 'mcq', 'broad', 'table_note'] as SectionType[]).map(
                    (t) => (
                      <Button
                        key={t}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-xs"
                        onClick={() => openNewItem(t)}
                      >
                        + {SECTION_FORMAT_MAP[t].shortLabelBn}
                      </Button>
                    )
                  )}
                </div>
              </div>
            ) : (
              groupedSections.map((group) => (
                <div
                  key={`${group.sectionType}::${group.sectionTitle}`}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        {group.sectionTitle}
                      </h3>
                      <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                        {toBanglaDigits(group.items.length)}টি
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleSectionColumns(group.sectionType, 1)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 transition-colors ${
                            group.columns === 1
                              ? 'bg-white dark:bg-zinc-800 text-[#00684A] font-semibold shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          <Columns3 className="h-3 w-3" />
                          ১ কলাম
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionColumns(group.sectionType, 2)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 transition-colors ${
                            group.columns === 2
                              ? 'bg-white dark:bg-zinc-800 text-[#00684A] font-semibold shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          <Columns2 className="h-3 w-3" />
                          ২ কলাম
                        </button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full text-xs"
                        onClick={() => openNewItem(group.sectionType)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        যুক্ত
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {group.items.map((item) => (
                      <ChorchaItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => {
                          setEditingItem(item);
                          setEditorOpen(true);
                        }}
                        onDuplicate={() => handleDuplicateItem(item)}
                        onDelete={() => handleDeleteItem(item)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Chorcha-style Floating Emerald Action Button */}
      {activeChapter && (
        <button
          type="button"
          onClick={() => openNewItem()}
          title="নতুন প্রশ্ন / কনটেন্ট যুক্ত করুন"
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#00684A] hover:bg-[#00553D] text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Question Editor Modal */}
      {activeChapter && (
        <QuestionEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          slug={subject.slug}
          chapterKey={activeChapter.chapter_key}
          initialItem={editingItem}
          defaultSectionType={defaultFormat}
          nextNumberHint={nextNumberHint}
          onSaved={() => refreshSubjectData()}
        />
      )}

      {/* Chapter Modal */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingChapter ? 'অধ্যায় সম্পাদনা করুন' : 'নতুন অধ্যায় তৈরি করুন'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveChapter} className="space-y-3.5">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">অধ্যায় নং</Label>
                <Input
                  value={chNum}
                  onChange={(e) => setChNum(e.target.value)}
                  placeholder="১"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">অংশ / বিভাগ (ঐচ্ছিক)</Label>
                <Input
                  value={chPart}
                  onChange={(e) => setChPart(e.target.value)}
                  placeholder="যেমন: গদ্যাংশ / কবিতাংশ"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">অধ্যায়ের শিরোনাম</Label>
              <Input
                value={chTitle}
                onChange={(e) => setChTitle(e.target.value)}
                placeholder="যেমন: ম্যাট্রিক্স ও নির্ণায়ক / জাবেদা ও খতিয়ান"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">লেখক / আলোচ্য বিষয় (ঐচ্ছিক)</Label>
              <Input
                value={chAuthor}
                onChange={(e) => setChAuthor(e.target.value)}
                placeholder="যেমন: রবীন্দ্রনাথ ঠাকুর বা অধ্যায় সারসংক্ষেপ"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChapterDialogOpen(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={chSaving}
                className="bg-[#00684A] hover:bg-[#00553D] text-white"
              >
                {chSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                সেভ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Book Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">গাইড বই প্রিন্ট ও হেডার সেটিংস</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs">বইয়ের শিরোনাম</Label>
              <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">রানিং হেডার টপ লেবেল (ডান পাশে)</Label>
              <Input value={rhTop} onChange={(e) => setRhTop(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">রানিং হেডার ব্যানার টেক্সট (নেভি রিবন)</Label>
              <Input value={rhBanner} onChange={(e) => setRhBanner(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ডিফল্ট পেজ সাইজ</Label>
                <Select
                  value={defaultPageSize}
                  onValueChange={(v) => setDefaultPageSize(v === 'a4' ? 'a4' : 'letter')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">MS Word Letter (8.5×11 in)</SelectItem>
                    <SelectItem value="a4">A4 (210×297 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">শুরুর পৃষ্ঠা নম্বর</Label>
                <Input
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={(e) => setStartPage(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-slate-800">শুরুতে ২টি খালি পৃষ্ঠা</p>
                <p className="text-[11px] text-slate-500">মুদ্রণের জন্য পৃষ্ঠা ১-২ খালি রাখবে</p>
              </div>
              <Switch checked={includeBlank} onCheckedChange={setIncludeBlank} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={savingSettings}
                className="bg-[#00684A] hover:bg-[#00553D] text-white"
              >
                {savingSettings && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                আপডেট করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* JSON Import / Export Modal */}
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="w-[95vw] max-w-3xl sm:max-w-3xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">
              JSON ইমপোর্ট / এক্সপোর্ট ({subject.name_bn})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <p className="text-xs text-slate-500">
              মূল প্রজেক্টের <code className="bg-slate-100 px-1 rounded">book.json</code> ফরম্যাটের ডেটা এখানে ইমপোর্ট বা ডাউনলোড করতে পারবেন।
            </p>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[320px] font-mono text-xs"
            />
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
              <span className="text-xs text-amber-900">
                আগের সকল অধ্যায় মুছে সম্পূর্ণ নতুন করে প্রতিস্থাপন করবেন?
              </span>
              <Switch checked={jsonReplace} onCheckedChange={setJsonReplace} />
            </div>
            {jsonError && <p className="text-xs text-red-600 font-medium">{jsonError}</p>}
          </div>
          <DialogFooter className="flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadJson}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              JSON ডাউনলোড
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setJsonOpen(false)}>
                বন্ধ করুন
              </Button>
              <Button
                type="button"
                disabled={jsonSaving}
                onClick={handleImportJson}
                className="bg-[#00684A] hover:bg-[#00553D] text-white"
              >
                {jsonSaving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                )}
                ডাটাবেজে ইমপোর্ট করুন
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChorchaShell>
  );
}

function ChorchaAnswerBox({
  title = 'উত্তর ও ব্যাখ্যা',
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl bg-[#E8F3EC] dark:bg-emerald-950/35 border border-[#D4E9DC] dark:border-emerald-900/60 overflow-hidden">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 list-none">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00684A] dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#00593D] dark:text-emerald-300">{title}</p>
            {subtitle && (
              <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-[#00684A] dark:text-emerald-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#D4E9DC] dark:border-emerald-900/50 bg-white/80 dark:bg-zinc-900/60 px-4 py-3 text-[13.5px] leading-relaxed text-slate-800 dark:text-zinc-200 space-y-1.5">
        {children}
      </div>
    </details>
  );
}

function ChorchaItemCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: GuideDbRow;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const c = (item.content || {}) as Record<string, unknown>;
  const t = item.section_type;

  return (
    <div className="rounded-2xl border border-slate-200/85 dark:border-zinc-800 bg-white dark:bg-zinc-900/85 p-5 shadow-2xs space-y-3.5">
      {/* Action & Board Tag Strip */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-slate-800 dark:text-zinc-100 space-y-2">
          {t === 'bio' && (
            <div className="flex flex-wrap gap-2">
              <span className={c.labelStyle === 'bold-italic' ? 'font-bold italic' : 'font-semibold'}>
                {String(c.label || '')}:
              </span>
              <RichText text={String(c.value || '')} />
            </div>
          )}

          {t === 'prose' &&
            (Array.isArray(c.paragraphs) ? (c.paragraphs as string[]) : []).map((p, i) => (
              <p key={i} className="text-justify">
                <RichText text={p} />
              </p>
            ))}

          {t === 'knowledge' && (
            <div className="space-y-2.5">
              <div className="font-semibold text-slate-900 dark:text-zinc-100">
                {item.item_number}. <RichText text={String(c.question || '')} />
              </div>
              <div className="rounded-xl bg-[#E8F3EC] dark:bg-emerald-950/35 border border-[#D4E9DC] dark:border-emerald-900/60 px-3.5 py-2.5 text-[13.5px] text-slate-800 dark:text-zinc-200">
                <strong className="text-[#00593D] dark:text-emerald-300">উত্তর:</strong>{' '}
                <RichText text={String(c.answer || '')} />
              </div>
            </div>
          )}

          {(t === 'comprehension' || t === 'broad') && (
            <div className="space-y-3">
              <div className="font-semibold text-slate-900 dark:text-zinc-100">
                {item.item_number}. <RichText text={String(c.question || '')} />{' '}
                {Boolean(c.marks) && (
                  <span className="ml-1.5 inline-flex rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                    নম্বর: {String(c.marks)}
                  </span>
                )}
              </div>
              <ChorchaAnswerBox
                title="উত্তর ও ব্যাখ্যা"
                subtitle={t === 'broad' ? 'রচনামূলক / গাণিতিক সমাধান' : 'অনুধাবনমূলক উত্তর'}
              >
                {(Array.isArray(c.answerParagraphs) ? (c.answerParagraphs as string[]) : []).map(
                  (p, i) => (
                    <p key={i} className="text-justify">
                      <RichText text={p} />
                    </p>
                  )
                )}
              </ChorchaAnswerBox>
            </div>
          )}

          {t === 'creative' && (
            <div className="space-y-3.5">
              <div className="text-justify text-slate-800 dark:text-zinc-100">
                <strong className="mr-1">{item.item_number}.</strong>
                <RichText text={String(c.stimulus || '')} />
              </div>

              <div className="space-y-3 pt-1">
                {(Array.isArray(c.subQuestions)
                  ? (c.subQuestions as CreativeSubQuestion[])
                  : []
                ).map((sq) => {
                  const sa = (
                    Array.isArray(c.subAnswers) ? (c.subAnswers as CreativeSubAnswer[]) : []
                  ).find((x) => x.label === sq.label);
                  return (
                    <div key={sq.label} className="space-y-2">
                      <div className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100">
                        <strong className="mr-1">{sq.label}.</strong>
                        <RichText text={sq.text} />
                      </div>
                      {sa && sa.paragraphs?.length > 0 && (
                        <ChorchaAnswerBox
                          title={`${sq.label} নং উত্তর`}
                          subtitle="সৃজনশীল উত্তর ও ব্যাখ্যা"
                        >
                          {sa.paragraphs.map((p, pi) => (
                            <p key={pi} className="text-justify">
                              <RichText text={p} />
                            </p>
                          ))}
                        </ChorchaAnswerBox>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {t === 'mcq' && (
            <div className="space-y-2.5">
              <div className="font-semibold text-slate-900 dark:text-zinc-100">
                {item.item_number}. <RichText text={String(c.question || '')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Array.isArray(c.options) ? (c.options as McqOption[]) : []).map((opt) => {
                  const isCorrect = opt.label === c.correctOption;
                  return (
                    <div
                      key={opt.label}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        isCorrect
                          ? 'border-emerald-400 bg-[#E8F3EC] dark:bg-emerald-950/50 text-[#00593D] dark:text-emerald-300 font-semibold'
                          : 'border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <strong className="mr-1">{opt.label}.</strong>
                      <RichText text={opt.text} />
                    </div>
                  );
                })}
              </div>
              {Boolean(c.explanation) && (
                <ChorchaAnswerBox title={`সঠিক উত্তর: ${String(c.correctOption || '')}`}>
                  <RichText text={String(c.explanation)} />
                </ChorchaAnswerBox>
              )}
            </div>
          )}

          {t === 'table_note' && (
            <div className="space-y-2">
              {Boolean(c.title) && (
                <div className="font-bold text-slate-900 dark:text-zinc-100">
                  {item.item_number}. {String(c.title)}
                </div>
              )}
              {Boolean(c.description) && <RichText text={String(c.description)} />}
              <div className="guide-table-wrap">
                <table className="guide-table">
                  <thead>
                    <tr>
                      {(Array.isArray(c.headers) ? (c.headers as string[]) : []).map((h, i) => (
                        <th key={i}>
                          <RichText text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(c.rows) ? (c.rows as string[][]) : []).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Boolean(c.caption) && <div className="guide-table-caption">{String(c.caption)}</div>}
            </div>
          )}
        </div>

        {/* Right Controls + Sky Board Badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onEdit}
              title="সম্পাদনা"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#00684A]"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              title="ডুপ্লিকেট"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="মুছুন"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {item.board_tag && (
            <span className="inline-flex rounded-full bg-sky-100/85 dark:bg-sky-950/60 px-2.5 py-0.5 text-[10.5px] font-semibold text-sky-700 dark:text-sky-300">
              {item.board_tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
