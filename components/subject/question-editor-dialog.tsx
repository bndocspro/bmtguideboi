'use client';

import { useRef, useState } from 'react';
import { Loader2, Plus, Trash2, Eye } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { RichText } from '@/components/rich-text';
import { RichMathToolbar } from '@/components/subject/rich-math-toolbar';
import { SECTION_FORMATS, SECTION_FORMAT_MAP, toBanglaDigits } from '@/lib/subjects';
import type {
  CreativeSubAnswer,
  CreativeSubQuestion,
  GuideDbRow,
  McqOption,
  SectionType,
} from '@/lib/types';

interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  chapterKey: string;
  initialItem?: GuideDbRow | null;
  defaultSectionType?: SectionType;
  nextNumberHint: string;
  onSaved: () => void;
}

function FormattedField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  return (
    <div className="space-y-1">
      {label ? (
        <Label className="text-xs font-medium text-slate-700">{label}</Label>
      ) : null}
      <RichMathToolbar textareaRef={ref} value={value} onChange={onChange} />
      <Textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-t-none text-sm font-bangla-ui leading-relaxed"
      />
    </div>
  );
}

export function QuestionEditorDialog(props: QuestionEditorDialogProps) {
  const { open, onOpenChange, initialItem, defaultSectionType = 'knowledge' } = props;
  const formKey = `${initialItem?.id ?? 'new'}-${defaultSectionType}-${open ? '1' : '0'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl sm:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {open ? <QuestionEditorForm key={formKey} {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function QuestionEditorForm({
  onOpenChange,
  slug,
  chapterKey,
  initialItem,
  defaultSectionType = 'knowledge',
  nextNumberHint,
  onSaved,
}: QuestionEditorDialogProps) {
  const isEditing = Boolean(initialItem);
  const initialType: SectionType = initialItem
    ? initialItem.section_type
    : defaultSectionType;
  const initialMeta = SECTION_FORMAT_MAP[initialType];
  const c = (initialItem?.content || {}) as Record<string, unknown>;

  const [sectionType, setSectionType] = useState<SectionType>(initialType);
  const [sectionTitle, setSectionTitle] = useState(
    initialItem?.section_title || initialMeta.labelBn
  );
  const [headerSvg, setHeaderSvg] = useState(
    initialItem ? initialItem.header_svg || '' : initialMeta.defaultHeaderSvg
  );
  const [columns, setColumns] = useState<1 | 2>(
    initialItem
      ? initialItem.columns === 2
        ? 2
        : 1
      : initialMeta.defaultColumns
  );
  const [itemNumber, setItemNumber] = useState(
    initialItem?.item_number || nextNumberHint || '১'
  );
  const [boardTag, setBoardTag] = useState(initialItem?.board_tag || '');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Format-specific state initialized cleanly from props
  const [bioLabel, setBioLabel] = useState(
    initialType === 'bio' ? String(c.label || '') : ''
  );
  const [bioValue, setBioValue] = useState(
    initialType === 'bio' ? String(c.value || '') : ''
  );
  const [bioStyle, setBioStyle] = useState<'normal' | 'bold-italic'>(
    initialType === 'bio' && c.labelStyle === 'bold-italic' ? 'bold-italic' : 'normal'
  );

  const [proseParagraphs, setProseParagraphs] = useState<string[]>(() => {
    if (initialType === 'prose' && Array.isArray(c.paragraphs) && c.paragraphs.length > 0) {
      return c.paragraphs as string[];
    }
    return [''];
  });

  const [questionText, setQuestionText] = useState(
    ['knowledge', 'comprehension', 'broad', 'mcq'].includes(initialType)
      ? String(c.question || '')
      : ''
  );
  const [answerText, setAnswerText] = useState(
    initialType === 'knowledge' ? String(c.answer || '') : ''
  );
  const [answerParagraphs, setAnswerParagraphs] = useState<string[]>(() => {
    if (
      (initialType === 'comprehension' || initialType === 'broad') &&
      Array.isArray(c.answerParagraphs) &&
      c.answerParagraphs.length > 0
    ) {
      return c.answerParagraphs as string[];
    }
    return [''];
  });
  const [marks, setMarks] = useState(
    initialType === 'broad' ? String(c.marks || '') : ''
  );

  const [stimulus, setStimulus] = useState(
    initialType === 'creative' ? String(c.stimulus || '') : ''
  );
  const [subQuestions, setSubQuestions] = useState<CreativeSubQuestion[]>(() => {
    if (
      initialType === 'creative' &&
      Array.isArray(c.subQuestions) &&
      c.subQuestions.length > 0
    ) {
      return c.subQuestions as CreativeSubQuestion[];
    }
    return [
      { label: 'ক', text: '' },
      { label: 'খ', text: '' },
      { label: 'গ', text: '' },
      { label: 'ঘ', text: '' },
    ];
  });
  const [answerHeading, setAnswerHeading] = useState(
    initialType === 'creative'
      ? String(c.answerHeading || '')
      : `${nextNumberHint || '১'} নং সৃজনশীল প্রশ্নের উত্তর`
  );
  const [subAnswers, setSubAnswers] = useState<CreativeSubAnswer[]>(() => {
    if (
      initialType === 'creative' &&
      Array.isArray(c.subAnswers) &&
      c.subAnswers.length > 0
    ) {
      return c.subAnswers as CreativeSubAnswer[];
    }
    return [
      { label: 'ক', paragraphs: [''] },
      { label: 'খ', paragraphs: [''] },
      { label: 'গ', paragraphs: [''] },
      { label: 'ঘ', paragraphs: [''] },
    ];
  });

  const [mcqOptions, setMcqOptions] = useState<McqOption[]>(() => {
    if (initialType === 'mcq' && Array.isArray(c.options) && c.options.length > 0) {
      return c.options as McqOption[];
    }
    return [
      { label: 'ক', text: '' },
      { label: 'খ', text: '' },
      { label: 'গ', text: '' },
      { label: 'ঘ', text: '' },
    ];
  });
  const [correctOption, setCorrectOption] = useState(
    initialType === 'mcq' ? String(c.correctOption || 'ক') : 'ক'
  );
  const [mcqExplanation, setMcqExplanation] = useState(
    initialType === 'mcq' ? String(c.explanation || '') : ''
  );

  const [tableTitle, setTableTitle] = useState(
    initialType === 'table_note' ? String(c.title || '') : ''
  );
  const [tableDesc, setTableDesc] = useState(
    initialType === 'table_note' ? String(c.description || '') : ''
  );
  const [tableHeaders, setTableHeaders] = useState<string[]>(() => {
    if (initialType === 'table_note' && Array.isArray(c.headers) && c.headers.length > 0) {
      return c.headers as string[];
    }
    return ['বিবরণ / চলক', 'সূত্র / মান', 'মন্তব্য'];
  });
  const [tableRows, setTableRows] = useState<string[][]>(() => {
    if (initialType === 'table_note' && Array.isArray(c.rows) && c.rows.length > 0) {
      return c.rows as string[][];
    }
    return [
      ['', '', ''],
      ['', '', ''],
    ];
  });
  const [tableCaption, setTableCaption] = useState(
    initialType === 'table_note' ? String(c.caption || '') : ''
  );

  function handleTypeChange(nextType: SectionType) {
    setSectionType(nextType);
    const meta = SECTION_FORMAT_MAP[nextType];
    if (!isEditing && meta) {
      setSectionTitle(meta.labelBn);
      setHeaderSvg(meta.defaultHeaderSvg);
      setColumns(meta.defaultColumns);
    }
  }

  function buildContentPayload() {
    switch (sectionType) {
      case 'bio':
        return { label: bioLabel.trim(), value: bioValue.trim(), labelStyle: bioStyle };
      case 'prose':
        return { paragraphs: proseParagraphs.map((p) => p.trim()).filter(Boolean) };
      case 'knowledge':
        return { question: questionText.trim(), answer: answerText.trim() };
      case 'comprehension':
        return {
          question: questionText.trim(),
          answerParagraphs: answerParagraphs.map((p) => p.trim()).filter(Boolean),
        };
      case 'broad':
        return {
          question: questionText.trim(),
          marks: marks.trim(),
          answerParagraphs: answerParagraphs.map((p) => p.trim()).filter(Boolean),
        };
      case 'creative':
        return {
          stimulus: stimulus.trim(),
          subQuestions: subQuestions.map((sq) => ({
            label: sq.label,
            text: sq.text.trim(),
          })),
          answerHeading:
            answerHeading.trim() || `${itemNumber || '১'} নং সৃজনশীল প্রশ্নের উত্তর`,
          subAnswers: subAnswers.map((sa) => ({
            label: sa.label,
            paragraphs: sa.paragraphs.map((p) => p.trim()).filter(Boolean),
          })),
        };
      case 'mcq':
        return {
          question: questionText.trim(),
          options: mcqOptions.map((o) => ({ label: o.label, text: o.text.trim() })),
          correctOption,
          explanation: mcqExplanation.trim(),
        };
      case 'table_note':
        return {
          title: tableTitle.trim(),
          description: tableDesc.trim(),
          headers: tableHeaders,
          rows: tableRows,
          caption: tableCaption.trim(),
        };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        chapter_key: chapterKey,
        section_type: sectionType,
        section_title: sectionTitle.trim() || SECTION_FORMAT_MAP[sectionType].labelBn,
        header_svg: headerSvg,
        columns,
        item_number: itemNumber.trim() || '১',
        board_tag: boardTag.trim(),
        content: buildContentPayload(),
      };

      const url = isEditing
        ? `/api/subjects/${slug}/items/${initialItem!.id}`
        : `/api/subjects/${slug}/items`;
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'সংরক্ষণ করা যায়নি।');
        setSaving(false);
        return;
      }

      setSaving(false);
      onOpenChange(false);
      onSaved();
    } catch {
      setError('সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে।');
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between pr-6">
          <DialogTitle className="text-base font-bold text-slate-900">
            {isEditing ? 'প্রশ্ন / কনটেন্ট সম্পাদনা করুন' : 'নতুন প্রশ্ন / কনটেন্ট যুক্ত করুন'}
          </DialogTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="h-7 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {showPreview ? 'প্রিভিউ লুকান' : 'লাইভ LaTeX প্রিভিউ'}
          </Button>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
          <div className="sm:col-span-2 space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">প্রশ্নের ফরম্যাট</Label>
            <Select
              value={sectionType}
              onValueChange={(v) => handleTypeChange(v as SectionType)}
            >
              <SelectTrigger className="w-full h-9 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_FORMATS.map((f) => (
                  <SelectItem key={f.type} value={f.type} className="text-xs">
                    {f.labelBn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">প্রিন্ট কলাম লেআউট</Label>
            <Select
              value={String(columns)}
              onValueChange={(v) => setColumns(v === '2' ? 2 : 1)}
            >
              <SelectTrigger className="w-full h-9 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-xs">১ কলাম (পূর্ণ পৃষ্ঠা)</SelectItem>
                <SelectItem value="2" className="text-xs">২ কলাম (বই ফরম্যাট)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">ক্রমিক নম্বর</Label>
            <Input
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              placeholder="১"
              className="h-9 bg-white text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">সেকশন শিরোনাম (প্রিন্ট হেডার)</Label>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="যেমন: জ্ঞানমূলক প্রশ্ন উত্তর"
              className="h-9 bg-white text-xs"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">বোর্ড / সাল ট্যাগ (ঐচ্ছিক)</Label>
            <Input
              value={boardTag}
              onChange={(e) => setBoardTag(e.target.value)}
              placeholder="[বাকাশিবো-২০২৫]"
              className="h-9 bg-white text-xs"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-medium text-slate-700">সেকশন ব্যানার SVG</Label>
            <Select
              value={headerSvg || 'custom'}
              onValueChange={(v) => setHeaderSvg(v === 'custom' ? '' : v)}
            >
              <SelectTrigger className="w-full h-9 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom" className="text-xs">কাস্টম বক্স হেডার</SelectItem>
                <SelectItem value="/assets/poeam_bio.svg" className="text-xs">কবি/লেখক পরিচিতি SVG</SelectItem>
                <SelectItem value="/assets/lesson_bio.svg" className="text-xs">পাঠ পরিচিতি SVG</SelectItem>
                <SelectItem value="/assets/knowledge_qna.svg" className="text-xs">জ্ঞানমূলক SVG</SelectItem>
                <SelectItem value="/assets/comprehension_qna.svg" className="text-xs">অনুধাবনমূলক SVG</SelectItem>
                <SelectItem value="/assets/cr_qna.svg" className="text-xs">সৃজনশীল প্রশ্ন SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`grid gap-5 ${showPreview ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          <div className={`${showPreview ? 'lg:col-span-7' : ''} space-y-4`}>
            {sectionType === 'bio' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">তথ্য লেবেল</Label>
                    <Input
                      value={bioLabel}
                      onChange={(e) => setBioLabel(e.target.value)}
                      placeholder="যেমন: জন্মতারিখ, সূত্র, প্রবক্তা"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">লেবেল স্টাইল</Label>
                    <Select
                      value={bioStyle}
                      onValueChange={(v) => setBioStyle(v as 'normal' | 'bold-italic')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">স্বাভাবিক</SelectItem>
                        <SelectItem value="bold-italic">বোল্ড ও ইটালিক</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <FormattedField
                  label="তথ্যের বিবরণ (LaTeX ও টেবিল সমর্থিত)"
                  value={bioValue}
                  onChange={setBioValue}
                  placeholder="এখানে বিবরণ লিখুন..."
                  rows={3}
                />
              </div>
            )}

            {sectionType === 'prose' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">পাঠ পরিচিতি / সারসংক্ষেপ অনুচ্ছেদ</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setProseParagraphs((prev) => [...prev, ''])}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    নতুন অনুচ্ছেদ
                  </Button>
                </div>
                {proseParagraphs.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        অনুচ্ছেদ {toBanglaDigits(idx + 1)}
                      </span>
                      {proseParagraphs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-red-500 hover:text-red-700"
                          onClick={() =>
                            setProseParagraphs((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <FormattedField
                      label=""
                      value={p}
                      onChange={(val) =>
                        setProseParagraphs((prev) => prev.map((x, i) => (i === idx ? val : x)))
                      }
                      rows={4}
                      placeholder="অনুচ্ছেদ লিখুন (LaTeX $...$ বা টেবিল ব্যবহার করতে পারেন)..."
                    />
                  </div>
                ))}
              </div>
            )}

            {sectionType === 'knowledge' && (
              <div className="space-y-4">
                <FormattedField
                  label="প্রশ্ন (Question)"
                  value={questionText}
                  onChange={setQuestionText}
                  rows={2}
                  placeholder="যেমন: নিউটনের দ্বিতীয় সূত্রের গাণিতিক রূপ কী?"
                />
                <FormattedField
                  label="উত্তর (Answer — LaTeX, Bold ও টেবিল সমর্থিত)"
                  value={answerText}
                  onChange={setAnswerText}
                  rows={3}
                  placeholder="যেমন: নিউটনের দ্বিতীয় সূত্রের গাণিতিক রূপ হলো $F = ma$।"
                />
              </div>
            )}

            {(sectionType === 'comprehension' || sectionType === 'broad') && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <FormattedField
                      label={sectionType === 'broad' ? 'রচনামূলক / গাণিতিক / হিসাববিজ্ঞান প্রশ্ন' : 'অনুধাবনমূলক প্রশ্ন'}
                      value={questionText}
                      onChange={setQuestionText}
                      rows={3}
                      placeholder="প্রশ্ন লিখুন (গণিতের জন্য $...$ ও হিসাববিজ্ঞানের জন্য টেবিল ব্যবহার করুন)..."
                    />
                  </div>
                  {sectionType === 'broad' && (
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">নম্বর (Marks)</Label>
                      <Input
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="১০"
                        className="h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">উত্তরের অনুচ্ছেদসমূহ (ধাপ / সমাধান)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAnswerParagraphs((prev) => [...prev, ''])}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      ধাপ / অনুচ্ছেদ যোগ
                    </Button>
                  </div>
                  {answerParagraphs.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          অনুচ্ছেদ / ধাপ {toBanglaDigits(idx + 1)}
                        </span>
                        {answerParagraphs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-red-500"
                            onClick={() =>
                              setAnswerParagraphs((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <FormattedField
                        label=""
                        value={p}
                        onChange={(val) =>
                          setAnswerParagraphs((prev) => prev.map((x, i) => (i === idx ? val : x)))
                        }
                        rows={3}
                        placeholder="উত্তর বা গাণিতিক সমাধান লিখুন ($$...$$ বা টেবিল ব্যবহার করুন)..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionType === 'creative' && (
              <div className="space-y-4">
                <FormattedField
                  label="উদ্দীপক (Stimulus — গল্প, টেবিল বা গাণিতিক তথ্য)"
                  value={stimulus}
                  onChange={setStimulus}
                  rows={4}
                  placeholder="উদ্দীপক লিখুন..."
                />

                <div className="space-y-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <Label className="text-xs font-semibold">প্রশ্নসমূহ (ক, খ, গ, ঘ)</Label>
                  {subQuestions.map((sq, idx) => (
                    <div key={sq.label} className="flex items-start gap-2">
                      <span className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#001B5E] text-white text-xs font-bold">
                        {sq.label}
                      </span>
                      <Input
                        value={sq.text}
                        onChange={(e) =>
                          setSubQuestions((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x))
                          )
                        }
                        placeholder={`${sq.label} নং প্রশ্ন লিখুন (LaTeX $...$ সমর্থিত)`}
                        className="bg-white text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">উত্তর শিরোনাম</Label>
                  <Input
                    value={answerHeading}
                    onChange={(e) => setAnswerHeading(e.target.value)}
                    placeholder={`${itemNumber || '১'} নং সৃজনশীল প্রশ্নের উত্তর`}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <Label className="text-xs font-semibold">উত্তরসমূহ (ক, খ, গ, ঘ)</Label>
                  {subAnswers.map((sa, idx) => (
                    <div key={sa.label} className="space-y-1.5 border-b border-slate-200/70 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#001B5E]">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#001B5E] text-white text-[11px]">
                            {sa.label}
                          </span>
                          নং উত্তর
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px]"
                          onClick={() =>
                            setSubAnswers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, paragraphs: [...x.paragraphs, ''] } : x
                              )
                            )
                          }
                        >
                          + অনুচ্ছেদ
                        </Button>
                      </div>
                      {sa.paragraphs.map((p, pIdx) => (
                        <FormattedField
                          key={pIdx}
                          label=""
                          value={p}
                          onChange={(val) =>
                            setSubAnswers((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      paragraphs: x.paragraphs.map((old, pi) =>
                                        pi === pIdx ? val : old
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                          rows={2}
                          placeholder={`${sa.label} এর উত্তর লিখুন...`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sectionType === 'mcq' && (
              <div className="space-y-4">
                <FormattedField
                  label="বহুনির্বাচনি প্রশ্ন (MCQ)"
                  value={questionText}
                  onChange={setQuestionText}
                  rows={2}
                  placeholder="প্রশ্নটি লিখুন..."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mcqOptions.map((opt, idx) => (
                    <div key={opt.label} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOption(opt.label)}
                        className={`h-8 w-8 shrink-0 rounded-md text-xs font-bold border transition-colors ${
                          correctOption === opt.label
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                      >
                        {opt.label}
                      </button>
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          setMcqOptions((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o))
                          )
                        }
                        placeholder={`বিকল্প ${opt.label}`}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-emerald-700 font-medium">
                  নির্বাচিত সঠিক উত্তর: <strong>{correctOption}</strong> (অন্য বিকল্প সঠিক করতে ক/খ/গ/ঘ বাটনে ক্লিক করুন)
                </p>

                <FormattedField
                  label="সংক্ষিপ্ত ব্যাখ্যা (ঐচ্ছিক)"
                  value={mcqExplanation}
                  onChange={setMcqExplanation}
                  rows={2}
                  placeholder="উত্তরের ব্যাখ্যা বা সূত্র লিখুন..."
                />
              </div>
            )}

            {sectionType === 'table_note' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">টেবিল / সূত্র ছকের শিরোনাম</Label>
                  <Input
                    value={tableTitle}
                    onChange={(e) => setTableTitle(e.target.value)}
                    placeholder="যেমন: গুরুত্বপূর্ণ পরিসংখ্যান সূত্রাবলি / পার্থক্য ছক"
                    className="text-xs"
                  />
                </div>

                <FormattedField
                  label="প্রারম্ভিক বিবরণ (ঐচ্ছিক)"
                  value={tableDesc}
                  onChange={setTableDesc}
                  rows={2}
                  placeholder="টেবিলের পূর্বে সংক্ষিপ্ত নির্দেশনা..."
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">ছকের তথ্য (LaTeX ও বোল্ড সমর্থিত)</Label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setTableHeaders((h) => [...h, `কলাম ${h.length + 1}`]);
                          setTableRows((r) => r.map((row) => [...row, '']));
                        }}
                      >
                        + কলাম
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          setTableRows((r) => [...r, Array(tableHeaders.length).fill('')])
                        }
                      >
                        + সারি
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          {tableHeaders.map((h, cIdx) => (
                            <th key={cIdx} className="border border-slate-200 p-1">
                              <Input
                                value={h}
                                onChange={(e) =>
                                  setTableHeaders((prev) =>
                                    prev.map((x, i) => (i === cIdx ? e.target.value : x))
                                  )
                                }
                                className="h-7 text-xs font-bold bg-white"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-slate-200 p-1">
                                <Input
                                  value={cell}
                                  onChange={(e) =>
                                    setTableRows((prev) =>
                                      prev.map((r, ri) =>
                                        ri === rIdx
                                          ? r.map((val, ci) => (ci === cIdx ? e.target.value : val))
                                          : r
                                      )
                                    )
                                  }
                                  placeholder="তথ্য / $LaTeX$"
                                  className="h-7 text-xs"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">ফুটনোট / ক্যাপশন (ঐচ্ছিক)</Label>
                  <Input
                    value={tableCaption}
                    onChange={(e) => setTableCaption(e.target.value)}
                    placeholder="টীকা: ..."
                    className="text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 h-fit sticky top-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-[#001B5E]">
                  লাইভ প্রিন্ট প্রিভিউ (KaTeX + টেবিল)
                </span>
                <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                  {columns === 2 ? '২ কলাম' : '১ কলাম'}
                </span>
              </div>

              <div
                className="text-[13.5px] leading-relaxed text-black space-y-2"
                style={{ fontFamily: "'kalpurush', 'Purno', sans-serif" }}
              >
                {sectionType === 'bio' && (
                  <div className="flex gap-2">
                    <span className={bioStyle === 'bold-italic' ? 'font-bold italic' : ''}>
                      {bioLabel || 'লেবেল'}
                    </span>
                    <span>:</span>
                    <RichText text={bioValue || 'বিবরণ...'} />
                  </div>
                )}

                {sectionType === 'prose' &&
                  proseParagraphs.map((p, idx) => (
                    <p key={idx} className="text-justify">
                      <RichText text={p || 'অনুচ্ছেদ প্রিভিউ...'} />
                    </p>
                  ))}

                {sectionType === 'knowledge' && (
                  <div className="space-y-1">
                    <div className="font-bold">
                      {itemNumber}. <RichText text={questionText || 'প্রশ্ন...'} />{' '}
                      {boardTag && <span className="font-normal">{boardTag}</span>}
                    </div>
                    <div className="pl-4">
                      <strong>উত্তর:</strong> <RichText text={answerText || 'উত্তর...'} />
                    </div>
                  </div>
                )}

                {(sectionType === 'comprehension' || sectionType === 'broad') && (
                  <div className="space-y-1.5">
                    <div className="font-bold">
                      {itemNumber}. <RichText text={questionText || 'প্রশ্ন...'} />{' '}
                      {marks && <span className="text-xs font-normal text-slate-500">[{marks}]</span>}{' '}
                      {boardTag}
                    </div>
                    {answerParagraphs.map((p, idx) => (
                      <p key={idx} className="text-justify">
                        {idx === 0 && <strong>উত্তর: </strong>}
                        <RichText text={p} />
                      </p>
                    ))}
                  </div>
                )}

                {sectionType === 'creative' && (
                  <div className="space-y-2">
                    <div>
                      <strong>{itemNumber}.</strong> <RichText text={stimulus || 'উদ্দীপক...'} />{' '}
                      {boardTag && <strong>{boardTag}</strong>}
                    </div>
                    <div className="pl-5 space-y-0.5">
                      {subQuestions.map((sq) => (
                        <div key={sq.label}>
                          <strong>{sq.label}.</strong> <RichText text={sq.text} />
                        </div>
                      ))}
                    </div>
                    <div className="text-center font-bold underline pt-1">
                      {answerHeading || `${itemNumber} নং সৃজনশীল প্রশ্নের উত্তর`}
                    </div>
                    <div className="space-y-1.5">
                      {subAnswers.map((sa) => (
                        <div key={sa.label}>
                          {sa.paragraphs.map((p, pi) => (
                            <p key={pi} className={pi > 0 ? 'pl-4' : ''}>
                              {pi === 0 && <strong>{sa.label}. </strong>}
                              <RichText text={p} />
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sectionType === 'mcq' && (
                  <div className="space-y-1.5">
                    <div className="font-bold">
                      {itemNumber}. <RichText text={questionText || 'প্রশ্ন...'} /> {boardTag}
                    </div>
                    <div className="grid grid-cols-2 gap-1 pl-4">
                      {mcqOptions.map((o) => (
                        <div key={o.label}>
                          <strong>{o.label}.</strong> <RichText text={o.text} />
                        </div>
                      ))}
                    </div>
                    <div className="pl-4 text-xs">
                      <strong>উত্তর:</strong> {correctOption}
                      {mcqExplanation && (
                        <span>
                          {' '}
                          (<RichText text={mcqExplanation} />)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {sectionType === 'table_note' && (
                  <div className="space-y-1.5">
                    {tableTitle && <div className="font-bold">{tableTitle}</div>}
                    {tableDesc && (
                      <div>
                        <RichText text={tableDesc} />
                      </div>
                    )}
                    <div className="guide-table-wrap">
                      <table className="guide-table">
                        <thead>
                          <tr>
                            {tableHeaders.map((h, i) => (
                              <th key={i}>
                                <RichText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((row, ri) => (
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
                    {tableCaption && <div className="guide-table-caption">{tableCaption}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল করুন
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#00684A] hover:bg-[#00553D] text-white rounded-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : isEditing ? (
              'পরিবর্তন সেভ করুন'
            ) : (
              'ডাটাবেজে যুক্ত করুন'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
