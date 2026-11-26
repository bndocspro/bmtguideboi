import katex from 'katex';

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyInlineFormatting(escapedText: string): string {
  let html = escapedText;
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return html;
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const stripped = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split('|').map((cell) => cell.trim());
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return false;
  const cells = parseTableRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.includes('|', 1);
}

function buildHtmlTable(headerLine: string, bodyLines: string[]): string {
  const headers = parseTableRow(headerLine);
  const theadHtml = `<thead><tr>${headers
    .map((h) => `<th>${applyInlineFormatting(escapeHtml(h))}</th>`)
    .join('')}</tr></thead>`;

  const tbodyHtml =
    bodyLines.length > 0
      ? `<tbody>${bodyLines
          .map((rowLine) => {
            const cells = parseTableRow(rowLine);
            // Pad or slice so row length aligns cleanly with headers
            const normalized = headers.map((_, idx) => cells[idx] ?? '');
            return `<tr>${normalized
              .map((cell) => `<td>${applyInlineFormatting(escapeHtml(cell))}</td>`)
              .join('')}</tr>`;
          })
          .join('')}</tbody>`
      : '';

  return `<div class="guide-table-wrap"><table class="guide-table">${theadHtml}${tbodyHtml}</table></div>`;
}

/**
 * Renders LaTeX ($...$, $$...$$), Markdown tables (| a | b |), **bold**, __underline__, *italic*, and newlines.
 */
export function renderFormattedText(rawText?: string | null): string {
  if (!rawText) return '';
  let text = String(rawText);

  const mathTokens: Array<{ expr: string; display: boolean }> = [];
  const placeholder = (idx: number) => `@@MATH_TOKEN_${idx}@@`;

  // 1. Extract Display Math $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) => {
    const idx = mathTokens.length;
    mathTokens.push({ expr: expr.trim(), display: true });
    return placeholder(idx);
  });

  // 2. Extract Inline Math $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_, expr: string) => {
    const idx = mathTokens.length;
    mathTokens.push({ expr: expr.trim(), display: false });
    return placeholder(idx);
  });

  // 3. Process line-by-line to detect Markdown tables cleanly
  const lines = text.split(/\r?\n/);
  const outputChunks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (
      i + 1 < lines.length &&
      isTableRowLine(lines[i]) &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headerLine = lines[i];
      i += 2;
      const bodyLines: string[] = [];
      while (i < lines.length && isTableRowLine(lines[i])) {
        bodyLines.push(lines[i]);
        i += 1;
      }
      outputChunks.push(buildHtmlTable(headerLine, bodyLines));
      continue;
    }

    const lineHtml = applyInlineFormatting(escapeHtml(lines[i]));
    if (outputChunks.length > 0 && !outputChunks[outputChunks.length - 1].endsWith('</div>')) {
      outputChunks.push('<br>' + lineHtml);
    } else {
      outputChunks.push(lineHtml);
    }
    i += 1;
  }

  let html = outputChunks.join('');

  // 4. Restore KaTeX vector math
  html = html.replace(/@@MATH_TOKEN_(\d+)@@/g, (_, idxStr: string) => {
    const token = mathTokens[Number(idxStr)];
    if (!token) return '';
    try {
      return katex.renderToString(token.expr, {
        displayMode: token.display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="math-fallback">${escapeHtml(token.expr)}</span>`;
    }
  });

  return html;
}

/**
 * Tokenizes text into splittable units while preserving $...$, $$...$$, and Markdown tables intact.
 */
export function tokenizeWordsPreservingMath(text: string): string[] {
  const tokens: string[] = [];
  // Match display math, inline math, markdown table blocks, or non-whitespace runs
  const regex = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\|[^\n]+\|\r?\n\|[\s:|-]+\|(?:\r?\n\|[^\n]+\|)*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      const plainWords = plain.match(/\S+/g);
      if (plainWords) tokens.push(...plainWords);
    }
    tokens.push(match[0]);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    const tailWords = tail.match(/\S+/g);
    if (tailWords) tokens.push(...tailWords);
  }

  return tokens;
}
