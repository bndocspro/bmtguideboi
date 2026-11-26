'use client';

import { useState, type RefObject } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Sigma,
  Table2,
  CornerDownLeft,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichMathToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (nextValue: string) => void;
}

const MATH_SNIPPETS = [
  { label: 'ভগ্নাংশ (Fraction)', snippet: '$\\frac{a}{b}$' },
  { label: 'বর্গমূল (Square Root)', snippet: '$\\sqrt{x}$' },
  { label: 'সমষ্টি (Summation)', snippet: '$\\sum_{i=1}^{n} x_i$' },
  { label: 'গাণিতিক গড় (Mean)', snippet: '$$\\bar{x} = \\frac{\\sum fx}{N}$$' },
  {
    label: 'পরিমিত ব্যবধান (Std Dev)',
    snippet: '$$\\sigma = \\sqrt{\\frac{\\sum f(x - \\bar{x})^2}{N}}$$',
  },
  { label: 'চক্রবৃদ্ধি মুনাফা', snippet: '$$A = P\\left(1 + \\frac{r}{100}\\right)^n$$' },
  {
    label: 'দ্বিঘাত সমীকরণ',
    snippet: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
  },
  {
    label: 'ম্যাট্রিক্স (২×২)',
    snippet: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$',
  },
  { label: 'শতকরা / গুণ / ভাগ', snippet: '$\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$' },
];

const TABLE_PRESETS = [
  {
    name: 'হিসাববিজ্ঞান জাবেদা ছক',
    headers: ['তারিখ', 'হিসাবের নাম ও ব্যাখ্যা', 'খঃ পৃঃ', 'ডেবিট (টাকা)', 'ক্রেডিট (টাকা)'],
    rows: [
      ['২০২৫ জানু ১', 'নগদান হিসাব ডেবিট\nমূলধন হিসাব ক্রেডিট', '', '৫০,০০০', ''],
      ['', '', '', '', '৫০,০০০'],
    ],
  },
  {
    name: 'রেওয়ামিল / খতিয়ান ছক',
    headers: ['ক্রমিক', 'হিসাবের শিরোনাম', 'খঃ পৃঃ', 'ডেবিট (টাকা)', 'ক্রেডিট (টাকা)'],
    rows: [
      ['১', 'নগদান হিসাব', '', '২৫,০০০', '—'],
      ['২', 'মূলধন হিসাব', '', '—', '২৫,০০০'],
    ],
  },
  {
    name: 'পরিসংখ্যান গণসংখ্যা সারণি',
    headers: ['শ্রেণি ব্যাপ্তি', 'মধ্যমান ($x$)', 'গণসংখ্যা ($f$)', '$fx$'],
    rows: [
      ['১০ - ২০', '১৫', '৫', '৭৫'],
      ['২০ - ৩০', '২৫', '৮', '২০০'],
    ],
  },
];

export function RichMathToolbar({ textareaRef, value, onChange }: RichMathToolbarProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const [colsCount, setColsCount] = useState(3);
  const [rowsCount, setRowsCount] = useState(3);
  const [headers, setHeaders] = useState<string[]>(['শিরোনাম ১', 'শিরোনাম ২', 'শিরোনাম ৩']);
  const [grid, setGrid] = useState<string[][]>([
    ['তথ্য ১', 'তথ্য ২', 'তথ্য ৩'],
    ['তথ্য ৪', 'তথ্য ৫', 'তথ্য ৬'],
  ]);

  function insertAtCursor(before: string, after = '', placeholder = '') {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + before + placeholder + after);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = start + before.length + selected.length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  }

  function resizeTable(nextRows: number, nextCols: number) {
    const r = Math.max(1, Math.min(12, nextRows));
    const c = Math.max(1, Math.min(8, nextCols));
    setRowsCount(r);
    setColsCount(c);
    setHeaders((prev) =>
      Array.from({ length: c }, (_, idx) => prev[idx] ?? `কলাম ${idx + 1}`)
    );
    setGrid((prev) =>
      Array.from({ length: r }, (_, rIdx) =>
        Array.from({ length: c }, (_, cIdx) => prev[rIdx]?.[cIdx] ?? '')
      )
    );
  }

  function applyPreset(preset: (typeof TABLE_PRESETS)[number]) {
    setColsCount(preset.headers.length);
    setRowsCount(preset.rows.length);
    setHeaders([...preset.headers]);
    setGrid(preset.rows.map((r) => r.map((cell) => cell.replace(/\n/g, ' '))));
  }

  function handleInsertMarkdownTable() {
    const clean = (s: string) => s.replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();
    const headerLine = `| ${headers.map((h) => clean(h) || ' ').join(' | ')} |`;
    const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const bodyLines = grid.map(
      (row) => `| ${row.map((cell) => clean(cell) || ' ').join(' | ')} |`
    );
    const markdown = `\n${headerLine}\n${sepLine}\n${bodyLines.join('\n')}\n`;
    insertAtCursor(markdown, '', '');
    setTableOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-slate-200 bg-slate-50 px-2 py-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-bold text-slate-700"
        onClick={() => insertAtCursor('**', '**', 'বোল্ড টেক্সট')}
        title="বোল্ড (**text**)"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-slate-700"
        onClick={() => insertAtCursor('*', '*', 'ইটালিক টেক্সট')}
        title="ইটালিক (*text*)"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-slate-700"
        onClick={() => insertAtCursor('__', '__', 'আন্ডারলাইন')}
        title="আন্ডারলাইন (__text__)"
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-[#001B5E] font-medium"
        onClick={() => insertAtCursor('$', '$', 'x^2 + y^2')}
        title="ইনলাইন LaTeX ($...$)"
      >
        <Sigma className="h-3.5 w-3.5 mr-1" />
        ইনলাইন গণিত
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-[#001B5E] font-medium"
        onClick={() => insertAtCursor('\n$$\n', '\n$$\n', '\\frac{a}{b}')}
        title="ব্লক LaTeX ($$...$$)"
      >
        ব্লক সমীকরণ
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-700"
          >
            সূত্র স্নিপেট
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-xs">দ্রুত LaTeX সূত্র</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MATH_SNIPPETS.map((s) => (
            <DropdownMenuItem
              key={s.label}
              onClick={() => insertAtCursor(s.snippet, '', '')}
              className="text-xs cursor-pointer"
            >
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-emerald-700 font-medium"
        onClick={() => setTableOpen(true)}
        title="টেবিল / হিসাব ছক যুক্ত করুন"
      >
        <Table2 className="h-3.5 w-3.5 mr-1" />
        টেবিল যুক্ত করুন
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-slate-600"
        onClick={() => insertAtCursor('\n', '', '')}
        title="নতুন লাইন"
      >
        <CornerDownLeft className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="w-[95vw] max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">টেবিল / হিসাব ছক তৈরি করুন</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">টেমপ্লেট:</span>
              {TABLE_PRESETS.map((p) => (
                <Button
                  key={p.name}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => applyPreset(p)}
                >
                  {p.name}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">সারি (Rows):</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={rowsCount}
                  onChange={(e) => resizeTable(Number(e.target.value), colsCount)}
                  className="w-16 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">কলাম (Cols):</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={colsCount}
                  onChange={(e) => resizeTable(rowsCount, Number(e.target.value))}
                  className="w-16 h-8 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    {headers.map((h, cIdx) => (
                      <th key={cIdx} className="border border-slate-200 p-1">
                        <Input
                          value={h}
                          onChange={(e) => {
                            const next = [...headers];
                            next[cIdx] = e.target.value;
                            setHeaders(next);
                          }}
                          placeholder={`হেডার ${cIdx + 1}`}
                          className="h-7 text-xs font-semibold bg-white"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border border-slate-200 p-1">
                          <Input
                            value={cell}
                            onChange={(e) => {
                              const next = grid.map((r) => [...r]);
                              next[rIdx][cIdx] = e.target.value;
                              setGrid(next);
                            }}
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

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setTableOpen(false)}>
              বাতিল
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#001B5E] hover:bg-[#001447] text-white"
              onClick={handleInsertMarkdownTable}
            >
              এডিটরে টেবিল বসান
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
