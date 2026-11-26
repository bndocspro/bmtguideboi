import { escapeHtml, renderFormattedText, tokenizeWordsPreservingMath } from './rich-text';
import { toBanglaDigits } from './subjects';
import type { BookChapter, BookData, BookSection } from './types';

export interface PaginateOptions {
  chapterId?: string;
  startPageNumber?: number;
  includeBlankIntroPages?: boolean;
  columnOverride?: 'auto' | '1' | '2';
}

const SAFETY_BUFFER_PX = 3;

function preloadImages(chapters: BookChapter[]): Promise<void[]> {
  const urls = new Set<string>();
  chapters.forEach((ch) => {
    (ch.sections || []).forEach((sec) => {
      if (sec.headerSvg) {
        const src = sec.headerSvg.startsWith('/') ? sec.headerSvg : '/' + sec.headerSvg;
        urls.add(src);
      }
    });
  });

  return Promise.all(
    Array.from(urls).map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
}

function createPageElement(pageNumber: number, meta: BookData) {
  const page = document.createElement('section');
  page.className = 'book-page';
  page.dataset.pageNumber = String(pageNumber);

  const header = document.createElement('header');
  header.className = 'running-header';
  header.innerHTML = `
    <div class="rh-top-label">${escapeHtml(meta.runningHeaderTop || meta.bookTitle || '')}</div>
    <div class="rh-box">
      <div class="rh-left-group">
        <div class="rh-ribbon">${escapeHtml(meta.runningHeaderBanner || meta.bookTitle || '')}</div>
        <div class="rh-chevrons" aria-hidden="true">
          <div class="rh-chevron"></div>
          <div class="rh-chevron"></div>
          <div class="rh-chevron"></div>
        </div>
      </div>
      <div class="rh-page-pill">${toBanglaDigits(pageNumber)}</div>
    </div>
    <div class="rh-dash-dot" aria-hidden="true"></div>
  `;

  const body = document.createElement('div');
  body.className = 'page-body';

  page.appendChild(header);
  page.appendChild(body);
  return { page, body };
}

function createSectionHeaderElement(section: BookSection): HTMLElement {
  if (section.headerSvg) {
    const src = section.headerSvg.startsWith('/') ? section.headerSvg : '/' + section.headerSvg;
    const wrap = document.createElement('div');
    wrap.className = 'section-header-svg';
    const img = document.createElement('img');
    img.src = src;
    img.alt = section.title || '';
    wrap.appendChild(img);
    return wrap;
  }
  const wrap = document.createElement('div');
  wrap.className = 'section-header-custom';
  wrap.innerHTML = `<div class="section-header-custom-box">${escapeHtml(section.title || '')}</div>`;
  return wrap;
}

function isSlotOverflowing(bodyEl: HTMLElement, slotEl: HTMLElement): boolean {
  const bodyRect = bodyEl.getBoundingClientRect();
  const bottomLimit = bodyRect.bottom - SAFETY_BUFFER_PX;
  const target = slotEl || bodyEl;

  if (target.lastElementChild) {
    const rect = target.lastElementChild.getBoundingClientRect();
    const style = window.getComputedStyle(target.lastElementChild);
    const marginBottom = parseFloat(style.marginBottom) || 0;
    if (rect.bottom + marginBottom > bottomLimit) {
      return true;
    }
  }

  if (slotEl && slotEl !== bodyEl && slotEl.children.length > 0) {
    const rect = slotEl.lastElementChild!.getBoundingClientRect();
    if (rect.bottom > bottomLimit) {
      return true;
    }
  }

  if (bodyEl.scrollHeight > bodyEl.clientHeight + 0.5) {
    return true;
  }

  return false;
}

function getRemainingHeight(bodyEl: HTMLElement): number {
  if (!bodyEl.lastElementChild) return bodyEl.clientHeight;
  const bodyRect = bodyEl.getBoundingClientRect();
  const bottomLimit = bodyRect.bottom - SAFETY_BUFFER_PX;
  const lastRect = bodyEl.lastElementChild.getBoundingClientRect();
  const style = window.getComputedStyle(bodyEl.lastElementChild);
  const mb = parseFloat(style.marginBottom) || 0;
  return Math.max(0, bottomLimit - (lastRect.bottom + mb));
}

function getSlotRemainingHeight(bodyEl: HTMLElement, slotEl: HTMLElement): number {
  const bodyRect = bodyEl.getBoundingClientRect();
  const bottomLimit = bodyRect.bottom - SAFETY_BUFFER_PX;
  const target = slotEl || bodyEl;
  if (target.lastElementChild) {
    const lastRect = target.lastElementChild.getBoundingClientRect();
    const style = window.getComputedStyle(target.lastElementChild);
    const mb = parseFloat(style.marginBottom) || 0;
    return Math.max(0, bottomLimit - (lastRect.bottom + mb));
  }
  const slotRect = target.getBoundingClientRect();
  return Math.max(0, bottomLimit - slotRect.top);
}

/**
 * Splits a rich string into alternating prose segments and atomic Markdown table blocks.
 */
function splitTextAndTableSegments(rawText: string): Array<{ kind: 'text' | 'table'; value: string }> {
  const tableRegex = /(\|[^\n]+\|\r?\n\|[\s:|-]+\|(?:\r?\n\|[^\n]+\|)*)/g;
  const parts: Array<{ kind: 'text' | 'table'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const txt = rawText.slice(lastIndex, match.index).trim();
      if (txt) parts.push({ kind: 'text', value: txt });
    }
    parts.push({ kind: 'table', value: match[0].trim() });
    lastIndex = tableRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    const tail = rawText.slice(lastIndex).trim();
    if (tail) parts.push({ kind: 'text', value: tail });
  }

  return parts.length > 0 ? parts : [{ kind: 'text', value: rawText }];
}

export async function paginateBook(
  container: HTMLElement,
  bookData: BookData,
  options: PaginateOptions = {}
): Promise<number> {
  const opts = {
    chapterId: options.chapterId || 'all',
    startPageNumber: options.startPageNumber ?? bookData.startPageNumber ?? 1,
    includeBlankIntroPages: Boolean(
      options.includeBlankIntroPages !== undefined
        ? options.includeBlankIntroPages
        : bookData.includeBlankIntroPages
    ),
    columnOverride: options.columnOverride || 'auto',
  };

  const chaptersToRender =
    opts.chapterId === 'all'
      ? bookData.chapters || []
      : (bookData.chapters || []).filter((c) => c.id === opts.chapterId);

  if (document.fonts) {
    try {
      const bodyFont = window.getComputedStyle(container).fontFamily;
      await Promise.all([
        document.fonts.load('12pt ' + bodyFont),
        document.fonts.load('bold 12pt ' + bodyFont),
        document.fonts.load('12pt "kalpurush"'),
        document.fonts.load('bold 12pt "kalpurush"'),
        document.fonts.load('12pt "Purno"'),
        document.fonts.load('bold 12pt "Purno"'),
      ]);
    } catch {
      // Fallback
    }
    if (document.fonts.ready) {
      await document.fonts.ready;
    }
  }

  await preloadImages(chaptersToRender);

  container.innerHTML = '';

  let currentPageNum = Number(opts.startPageNumber) || 1;
  let currentPageObj: { page: HTMLElement; body: HTMLElement };

  function openNewPage() {
    const obj = createPageElement(currentPageNum, bookData);
    container.appendChild(obj.page);
    currentPageObj = obj;
    currentPageNum += 1;
    return obj;
  }

  if (opts.includeBlankIntroPages) {
    const savedStart = currentPageNum;
    currentPageNum = 1;
    openNewPage();
    openNewPage();
    currentPageNum = Math.max(3, savedStart);
  }

  openNewPage();

  function placeSectionHeader(section: BookSection, minRemainingPx: number) {
    const headerEl = createSectionHeaderElement(section);
    currentPageObj.body.appendChild(headerEl);
    if (
      (isSlotOverflowing(currentPageObj.body, currentPageObj.body) ||
        getRemainingHeight(currentPageObj.body) < minRemainingPx) &&
      currentPageObj.body.children.length > 1
    ) {
      currentPageObj.body.removeChild(headerEl);
      openNewPage();
      currentPageObj.body.appendChild(headerEl);
    }
    return headerEl;
  }

  function createFlowWriter(columns: number) {
    const isTwoCol = Number(columns) === 2;
    let grid: HTMLElement | null = null;
    let colLeft: HTMLElement | null = null;
    let colRight: HTMLElement | null = null;
    let activeCol: 'single' | 'left' | 'right' = isTwoCol ? 'left' : 'single';

    function createGridOnCurrentPage() {
      grid = document.createElement('div');
      grid.className = 'two-col-grid';
      colLeft = document.createElement('div');
      colLeft.className = 'two-col-left';
      colRight = document.createElement('div');
      colRight.className = 'two-col-right';
      grid.appendChild(colLeft);
      grid.appendChild(colRight);
      currentPageObj.body.appendChild(grid);
      activeCol = 'left';
    }

    if (isTwoCol) {
      createGridOnCurrentPage();
    }

    function getTarget(): HTMLElement {
      if (!isTwoCol) return currentPageObj.body;
      return activeCol === 'left' ? colLeft! : colRight!;
    }

    function advanceSlot() {
      if (!isTwoCol) {
        openNewPage();
        return;
      }
      if (activeCol === 'left') {
        activeCol = 'right';
      } else {
        openNewPage();
        createGridOnCurrentPage();
      }
    }

    function appendAtomic(el: HTMLElement) {
      const target = getTarget();
      target.appendChild(el);
      if (isSlotOverflowing(currentPageObj.body, target)) {
        if (target.children.length > 1 || currentPageObj.body.children.length > 1) {
          target.removeChild(el);
          advanceSlot();
          const nextTarget = getTarget();
          nextTarget.appendChild(el);
          if (isSlotOverflowing(currentPageObj.body, nextTarget)) {
            if (nextTarget.children.length > 1 || currentPageObj.body.children.length > 1) {
              nextTarget.removeChild(el);
              openNewPage();
              if (isTwoCol) createGridOnCurrentPage();
              getTarget().appendChild(el);
            }
          }
        }
      }
    }

    function appendHeading(el: HTMLElement, minSpaceAfter: number) {
      const target = getTarget();
      target.appendChild(el);
      const rem = getSlotRemainingHeight(currentPageObj.body, target);
      if (
        (isSlotOverflowing(currentPageObj.body, target) || rem < minSpaceAfter) &&
        (target.children.length > 1 || currentPageObj.body.children.length > 1)
      ) {
        target.removeChild(el);
        advanceSlot();
        const nextTarget = getTarget();
        nextTarget.appendChild(el);
        const nextRem = getSlotRemainingHeight(currentPageObj.body, nextTarget);
        if (
          (isSlotOverflowing(currentPageObj.body, nextTarget) || nextRem < minSpaceAfter) &&
          (nextTarget.children.length > 1 || currentPageObj.body.children.length > 1)
        ) {
          nextTarget.removeChild(el);
          openNewPage();
          if (isTwoCol) createGridOnCurrentPage();
          getTarget().appendChild(el);
        }
      }
    }

    function appendSplittable(
      fullText: string,
      buildEl: (txt: string, isFirstChunk: boolean) => HTMLElement,
      isContinuation = false
    ) {
      const segments = splitTextAndTableSegments(fullText);
      if (segments.length > 1) {
        segments.forEach((seg, idx) => {
          if (seg.kind === 'table') {
            appendAtomic(buildEl(seg.value, !isContinuation && idx === 0));
          } else {
            appendSplittable(seg.value, buildEl, isContinuation || idx > 0);
          }
        });
        return;
      }

      if (segments[0]?.kind === 'table') {
        appendAtomic(buildEl(segments[0].value, !isContinuation));
        return;
      }

      const target = getTarget();
      const firstFlag = !isContinuation;
      const fullEl = buildEl(fullText, firstFlag);
      target.appendChild(fullEl);
      if (!isSlotOverflowing(currentPageObj.body, target)) {
        return;
      }

      target.removeChild(fullEl);
      const words = tokenizeWordsPreservingMath(fullText);

      let lo = 1;
      let hi = words.length - 1;
      let best = 0;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const testText = words.slice(0, mid).join(' ');
        const testEl = buildEl(testText, firstFlag);
        testEl.style.textAlignLast = 'justify';
        target.appendChild(testEl);
        const over = isSlotOverflowing(currentPageObj.body, target);
        target.removeChild(testEl);
        if (!over) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      const minWordsToKeep = isTwoCol ? 4 : 5;
      if (best < minWordsToKeep && (target.children.length > 0 || currentPageObj.body.children.length > 1)) {
        advanceSlot();
        appendSplittable(fullText, buildEl, isContinuation);
        return;
      }

      if (best === 0) {
        if (target.children.length > 0 || currentPageObj.body.children.length > 1) {
          advanceSlot();
        } else {
          // Force place to avoid infinite recursion on single oversized element
          const forced = buildEl(fullText, firstFlag);
          target.appendChild(forced);
          return;
        }
        appendSplittable(fullText, buildEl, isContinuation);
        return;
      }

      let firstChunk = words.slice(0, best).join(' ');
      let placedEl = buildEl(firstChunk, firstFlag);
      placedEl.style.textAlignLast = 'justify';
      target.appendChild(placedEl);

      while (best > minWordsToKeep && isSlotOverflowing(currentPageObj.body, target)) {
        best -= 1;
        firstChunk = words.slice(0, best).join(' ');
        target.removeChild(placedEl);
        placedEl = buildEl(firstChunk, firstFlag);
        placedEl.style.textAlignLast = 'justify';
        target.appendChild(placedEl);
      }

      if (isSlotOverflowing(currentPageObj.body, target)) {
        target.removeChild(placedEl);
        advanceSlot();
        appendSplittable(fullText, buildEl, isContinuation);
        return;
      }

      advanceSlot();
      appendSplittable(words.slice(best).join(' '), buildEl, true);
    }

    function balanceTail() {
      if (!isTwoCol || !colLeft || !colRight) return;
      if (colRight.children.length > 0) return;
      const nodes = Array.from(colLeft.children);
      if (nodes.length < 2) return;

      const heights = nodes.map((n) => n.getBoundingClientRect().height);
      const totalH = heights.reduce((a, b) => a + b, 0);
      const halfH = totalH / 2;

      let acc = 0;
      let splitIdx = Math.ceil(nodes.length / 2);
      for (let i = 0; i < nodes.length - 1; i++) {
        acc += heights[i];
        if (acc >= halfH) {
          splitIdx = i + 1;
          break;
        }
      }

      if (
        splitIdx > 1 &&
        (nodes[splitIdx - 1].classList.contains('comp-q') ||
          nodes[splitIdx - 1].classList.contains('broad-q') ||
          nodes[splitIdx - 1].classList.contains('cq-ans-heading'))
      ) {
        splitIdx -= 1;
      }

      if (splitIdx <= 0 || splitIdx >= nodes.length) return;

      for (let i = splitIdx; i < nodes.length; i++) {
        colRight.appendChild(nodes[i]);
      }
    }

    return { appendAtomic, appendHeading, appendSplittable, balanceTail };
  }

  function createKqElement(
    item: NonNullable<BookSection['items']>[number],
    part: 'both' | 'q' | 'a'
  ) {
    const wrap = document.createElement('div');
    wrap.className = 'kq-block';

    if (part === 'both' || part === 'q') {
      const qRow = document.createElement('div');
      qRow.className = 'kq-q-row';
      const boardHtml = item.board ? ` <span>${escapeHtml(item.board)}</span>` : '';
      qRow.innerHTML = `
        <div class="kq-num">${escapeHtml(item.number || '')}.</div>
        <div class="kq-q-text">${renderFormattedText(item.question)}${boardHtml}</div>
      `;
      wrap.appendChild(qRow);
    }

    if (part === 'both' || part === 'a') {
      const aRow = document.createElement('div');
      aRow.className = 'kq-a-row';
      aRow.innerHTML = `<span class="kq-ans-label">উত্তর:</span> ${renderFormattedText(item.answer)}`;
      wrap.appendChild(aRow);
    }

    return wrap;
  }

  function renderKnowledgeSection(section: BookSection, effectiveCols: 1 | 2) {
    const items = section.items || [];
    placeSectionHeader(section, 110);
    if (!items.length) return;

    if (effectiveCols !== 2) {
      const writer = createFlowWriter(1);
      items.forEach((item) => {
        writer.appendAtomic(createKqElement(item, 'both'));
      });
      return;
    }

    let queue = items.map((item) => ({ item, part: 'both' as 'both' | 'q' | 'a' }));

    while (queue.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'two-col-grid knowledge-grid';
      const colLeft = document.createElement('div');
      colLeft.className = 'two-col-left knowledge-col-left';
      const colRight = document.createElement('div');
      colRight.className = 'two-col-right knowledge-col-right';
      grid.appendChild(colLeft);
      grid.appendChild(colRight);
      currentPageObj.body.appendChild(grid);

      const snapshotQueue = queue.slice();
      const halfIdx = Math.ceil(snapshotQueue.length / 2);
      snapshotQueue.slice(0, halfIdx).forEach((entry) => {
        colLeft.appendChild(createKqElement(entry.item, entry.part));
      });
      snapshotQueue.slice(halfIdx).forEach((entry) => {
        colRight.appendChild(createKqElement(entry.item, entry.part));
      });

      if (
        !isSlotOverflowing(currentPageObj.body, colLeft) &&
        !isSlotOverflowing(currentPageObj.body, colRight)
      ) {
        queue = [];
        break;
      }

      colLeft.innerHTML = '';
      colRight.innerHTML = '';

      const fillColumn = (colEl: HTMLElement) => {
        while (queue.length > 0) {
          const next = queue[0];
          const el = createKqElement(next.item, next.part);
          colEl.appendChild(el);
          if (!isSlotOverflowing(currentPageObj.body, colEl)) {
            queue.shift();
          } else {
            colEl.removeChild(el);
            if (next.part === 'both') {
              const qEl = createKqElement(next.item, 'q');
              colEl.appendChild(qEl);
              if (!isSlotOverflowing(currentPageObj.body, colEl)) {
                queue[0] = { item: next.item, part: 'a' };
              } else {
                colEl.removeChild(qEl);
              }
            }
            break;
          }
        }
      };

      fillColumn(colLeft);
      fillColumn(colRight);

      if (colLeft.children.length === 0 && colRight.children.length === 0 && queue.length > 0) {
        const forced = queue.shift()!;
        colLeft.appendChild(createKqElement(forced.item, forced.part));
      }

      if (queue.length > 0) {
        openNewPage();
      }
    }
  }

  chaptersToRender.forEach((chapter, chIdx) => {
    if (chaptersToRender.length > 1) {
      if (chIdx > 0 && currentPageObj.body.children.length > 0) {
        openNewPage();
      }
      const chBanner = document.createElement('div');
      chBanner.className = 'chapter-divider';
      chBanner.innerHTML = `
        ${chapter.part ? `<div class="ch-part">${escapeHtml(chapter.part)}</div>` : ''}
        ${chapter.chapterNumber ? `<div class="ch-num">অধ্যায় ${escapeHtml(chapter.chapterNumber)}</div>` : ''}
        <div class="ch-title">${escapeHtml(chapter.title || '')}</div>
        ${chapter.author ? `<div class="ch-author">${escapeHtml(chapter.author)}</div>` : ''}
      `;
      const bannerWriter = createFlowWriter(1);
      bannerWriter.appendAtomic(chBanner);
    }

    (chapter.sections || []).forEach((section) => {
      const baseCols: 1 | 2 =
        section.columns !== undefined ? (Number(section.columns) === 2 ? 2 : 1) : section.type === 'knowledge' ? 2 : 1;
      const cols: 1 | 2 =
        opts.columnOverride === '1'
          ? 1
          : opts.columnOverride === '2'
            ? 2
            : baseCols;

      if (section.type === 'bio') {
        placeSectionHeader(section, 80);
        const writer = createFlowWriter(cols);
        (section.items || []).forEach((item) => {
          const row = document.createElement('div');
          row.className = 'bio-row';
          const labelCls = item.labelStyle === 'bold-italic' ? 'bio-label bold-italic' : 'bio-label';
          row.innerHTML = `
            <div class="${labelCls}">${escapeHtml(item.label || '')}</div>
            <div class="bio-colon">:</div>
            <div class="bio-value">${renderFormattedText(item.value)}</div>
          `;
          writer.appendAtomic(row);
        });
        writer.balanceTail();
      } else if (section.type === 'prose') {
        placeSectionHeader(section, 75);
        const writer = createFlowWriter(cols);
        (section.paragraphs || []).forEach((pText) => {
          writer.appendSplittable(pText, (txt) => {
            const p = document.createElement('p');
            p.className = 'prose-p';
            p.innerHTML = renderFormattedText(txt);
            return p;
          });
        });
        writer.balanceTail();
      } else if (section.type === 'knowledge') {
        renderKnowledgeSection(section, cols);
      } else if (section.type === 'comprehension' || section.type === 'broad') {
        placeSectionHeader(section, 95);
        const writer = createFlowWriter(cols);

        (section.items || []).forEach((item) => {
          const qEl = document.createElement('div');
          qEl.className = section.type === 'broad' ? 'broad-q' : 'comp-q';
          const marksHtml = item.marks ? `<span class="broad-marks">[নম্বর: ${escapeHtml(item.marks)}]</span>` : '';
          const boardHtml = item.board ? ` ${escapeHtml(item.board)}` : '';
          qEl.innerHTML = `${escapeHtml(item.number || '')}. ${renderFormattedText(item.question)}${marksHtml}${boardHtml}`;

          writer.appendHeading(qEl, 42);

          const paras = item.answerParagraphs || (item.answer ? [item.answer] : []);
          paras.forEach((pText, pIdx) => {
            writer.appendSplittable(pText, (txt, isFirstChunk) => {
              const p = document.createElement('p');
              p.className = 'comp-p';
              if (pIdx === 0 && isFirstChunk) {
                p.innerHTML = `<span class="comp-ans-label">উত্তর:</span> ${renderFormattedText(txt)}`;
              } else {
                p.innerHTML = renderFormattedText(txt);
              }
              return p;
            });
          });
        });
        writer.balanceTail();
      } else if (section.type === 'creative') {
        placeSectionHeader(section, 115);
        const writer = createFlowWriter(cols);

        (section.items || []).forEach((item) => {
          const qGroup = document.createElement('div');
          qGroup.className = 'cq-question-group';

          const stim = document.createElement('div');
          stim.className = 'cq-stimulus-row';
          const boardHtml = item.board ? ` <span class="cq-board">${escapeHtml(item.board)}</span>` : '';
          stim.innerHTML = `
            <div class="cq-num">${escapeHtml(item.number || '')}.</div>
            <div>${renderFormattedText(item.stimulus)}${boardHtml}</div>
          `;
          qGroup.appendChild(stim);

          const subqList = document.createElement('div');
          subqList.className = 'cq-subq-list';
          (item.subQuestions || []).forEach((sq) => {
            const sqRow = document.createElement('div');
            sqRow.className = 'cq-subq-row';
            sqRow.innerHTML = `
              <div class="cq-subq-label">${escapeHtml(sq.label)}.</div>
              <div>${renderFormattedText(sq.text)}</div>
            `;
            subqList.appendChild(sqRow);
          });
          qGroup.appendChild(subqList);
          writer.appendAtomic(qGroup);

          const ansHeading = document.createElement('div');
          ansHeading.className = 'cq-ans-heading';
          ansHeading.textContent = item.answerHeading || `${item.number || ''} নং সৃজনশীল প্রশ্নের উত্তর`;
          writer.appendHeading(ansHeading, 55);

          (item.subAnswers || []).forEach((sa) => {
            (sa.paragraphs || []).forEach((pText, pIdx) => {
              writer.appendSplittable(pText, (txt, isFirstChunk) => {
                if (pIdx === 0 && isFirstChunk) {
                  const row = document.createElement('div');
                  row.className = 'cq-suba-row';
                  row.innerHTML = `
                    <div class="cq-suba-label">${escapeHtml(sa.label)}.</div>
                    <div class="cq-suba-text">${renderFormattedText(txt)}</div>
                  `;
                  return row;
                }
                const cont = document.createElement('div');
                cont.className = 'cq-suba-cont';
                cont.innerHTML = renderFormattedText(txt);
                return cont;
              });
            });
          });
        });
        writer.balanceTail();
      } else if (section.type === 'mcq') {
        placeSectionHeader(section, 95);
        const writer = createFlowWriter(cols);

        (section.items || []).forEach((item) => {
          const block = document.createElement('div');
          block.className = 'mcq-block';
          const boardHtml = item.board ? ` <span>${escapeHtml(item.board)}</span>` : '';
          const optionsHtml = (item.options || [])
            .map(
              (o) =>
                `<div class="mcq-opt"><span class="mcq-opt-label">${escapeHtml(o.label)}.</span><span>${renderFormattedText(o.text)}</span></div>`
            )
            .join('');
          const expHtml = item.explanation ? ` (${renderFormattedText(item.explanation)})` : '';
          block.innerHTML = `
            <div class="mcq-q-row">
              <div>${escapeHtml(item.number || '')}.</div>
              <div>${renderFormattedText(item.question)}${boardHtml}</div>
            </div>
            <div class="mcq-options-grid">${optionsHtml}</div>
            <div class="mcq-ans-row"><strong>উত্তর:</strong> ${escapeHtml(item.correctOption || '')}${expHtml}</div>
          `;
          writer.appendAtomic(block);
        });
        writer.balanceTail();
      } else if (section.type === 'table_note') {
        placeSectionHeader(section, 100);
        const writer = createFlowWriter(cols);

        (section.items || []).forEach((item) => {
          const wrap = document.createElement('div');
          wrap.className = 'guide-table-wrap';
          const titleHtml = item.title
            ? `<div class="guide-table-title">${item.number ? escapeHtml(item.number) + '. ' : ''}${escapeHtml(item.title)}</div>`
            : '';
          const descHtml = item.description
            ? `<div class="prose-p">${renderFormattedText(item.description)}</div>`
            : '';
          const headers = item.headers || [];
          const rows = item.rows || [];
          const thead = headers.length
            ? `<thead><tr>${headers.map((h) => `<th>${renderFormattedText(h)}</th>`).join('')}</tr></thead>`
            : '';
          const tbody = rows.length
            ? `<tbody>${rows
                .map(
                  (r) =>
                    `<tr>${r.map((cell) => `<td>${renderFormattedText(cell)}</td>`).join('')}</tr>`
                )
                .join('')}</tbody>`
            : '';
          const capHtml = item.caption
            ? `<div class="guide-table-caption">${escapeHtml(item.caption)}</div>`
            : '';
          wrap.innerHTML = `${titleHtml}${descHtml}<table class="guide-table">${thead}${tbody}</table>${capHtml}`;
          writer.appendAtomic(wrap);
        });
        writer.balanceTail();
      }
    });
  });

  return container.querySelectorAll('.book-page').length;
}
