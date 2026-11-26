'use client';

import { useMemo } from 'react';
import { renderFormattedText } from '@/lib/rich-text';

interface RichTextProps {
  text?: string | null;
  className?: string;
}

export function RichText({ text, className = '' }: RichTextProps) {
  const html = useMemo(() => renderFormattedText(text), [text]);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
