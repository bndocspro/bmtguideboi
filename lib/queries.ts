import { sql, getPool, assertValidTableName } from './db';
import { SECTION_FORMAT_MAP, toBanglaDigits } from './subjects';
import type {
  BookChapter,
  BookData,
  BookSection,
  BookSectionItem,
  GuideChapterSummary,
  GuideDbRow,
  SectionType,
  SubjectRecord,
} from './types';

export async function getAllSubjectsWithStats(): Promise<SubjectRecord[]> {
  const subjects = (await sql`
    SELECT *
    FROM public.bmt_subjects
    ORDER BY sort_order ASC
  `) as SubjectRecord[];

  if (subjects.length === 0) return [];

  // Query live chapter & item counts across every dedicated subject table in one batched query
  const unionParts = subjects.map((s) => {
    const tbl = assertValidTableName(s.table_name);
    return `
      SELECT
        '${tbl}'::text AS table_name,
        COUNT(DISTINCT CASE WHEN record_kind = 'chapter' THEN chapter_key END)::int AS chapter_count,
        COUNT(*) FILTER (WHERE record_kind = 'item')::int AS item_count
      FROM public."${tbl}"
    `;
  });

  const pool = getPool();
  const { rows: statRows } = await pool.query(unionParts.join(' UNION ALL '));
  const statsMap = new Map<string, { chapter_count: number; item_count: number }>();
  for (const r of statRows as Array<{ table_name: string; chapter_count: number; item_count: number }>) {
    statsMap.set(r.table_name, {
      chapter_count: Number(r.chapter_count || 0),
      item_count: Number(r.item_count || 0),
    });
  }

  return subjects.map((s) => {
    const st = statsMap.get(s.table_name);
    return {
      ...s,
      chapter_count: st?.chapter_count ?? 0,
      item_count: st?.item_count ?? 0,
    };
  });
}

export async function getSubjectBySlug(slug: string): Promise<SubjectRecord | null> {
  const rows = (await sql`
    SELECT *
    FROM public.bmt_subjects
    WHERE slug = ${slug}
    LIMIT 1
  `) as SubjectRecord[];
  return rows[0] ?? null;
}

export async function getSubjectRows(tableName: string): Promise<GuideDbRow[]> {
  const safeTable = assertValidTableName(tableName);
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT
      id, record_kind, chapter_key, chapter_number, chapter_title, chapter_author,
      chapter_part, chapter_order, section_type, section_title, header_svg,
      columns, section_order, item_order, item_number, board_tag, content,
      is_published, created_at, updated_at
    FROM public."${safeTable}"
    ORDER BY chapter_order ASC, record_kind ASC, section_order ASC, item_order ASC, created_at ASC
  `);
  return rows as GuideDbRow[];
}

export function extractChaptersSummary(rows: GuideDbRow[]): GuideChapterSummary[] {
  const map = new Map<string, GuideChapterSummary>();
  for (const r of rows) {
    if (!map.has(r.chapter_key)) {
      map.set(r.chapter_key, {
        chapter_key: r.chapter_key,
        chapter_number: r.chapter_number,
        chapter_title: r.chapter_title,
        chapter_author: r.chapter_author,
        chapter_part: r.chapter_part,
        chapter_order: r.chapter_order,
        item_count: 0,
      });
    }
    if (r.record_kind === 'item') {
      const entry = map.get(r.chapter_key)!;
      entry.item_count += 1;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.chapter_order - b.chapter_order);
}

export function rowsToBookData(subject: SubjectRecord, rows: GuideDbRow[]): BookData {
  const chaptersMap = new Map<
    string,
    {
      chapter: BookChapter;
      chapterOrder: number;
      sectionsMap: Map<string, { section: BookSection; sectionOrder: number }>;
    }
  >();

  for (const row of rows) {
    let chEntry = chaptersMap.get(row.chapter_key);
    if (!chEntry) {
      chEntry = {
        chapterOrder: row.chapter_order,
        chapter: {
          id: row.chapter_key,
          chapterNumber: row.chapter_number,
          title: row.chapter_title,
          author: row.chapter_author || undefined,
          part: row.chapter_part || undefined,
          sections: [],
        },
        sectionsMap: new Map(),
      };
      chaptersMap.set(row.chapter_key, chEntry);
    }

    if (row.record_kind !== 'item' || !row.is_published) continue;

    const secKey = `${row.section_type}::${row.section_title}::${row.section_order}`;
    let secEntry = chEntry.sectionsMap.get(secKey);
    if (!secEntry) {
      const meta = SECTION_FORMAT_MAP[row.section_type];
      secEntry = {
        sectionOrder: row.section_order,
        section: {
          type: row.section_type,
          title: row.section_title || meta?.labelBn || '',
          headerSvg: row.header_svg || undefined,
          columns: row.columns === 2 ? 2 : 1,
          paragraphs: row.section_type === 'prose' ? [] : undefined,
          items: row.section_type === 'prose' ? undefined : [],
        },
      };
      chEntry.sectionsMap.set(secKey, secEntry);
    }

    const content = (row.content || {}) as Record<string, unknown>;

    if (row.section_type === 'prose') {
      const paras = Array.isArray(content.paragraphs)
        ? (content.paragraphs as string[])
        : content.text
          ? [String(content.text)]
          : [];
      secEntry.section.paragraphs = [...(secEntry.section.paragraphs || []), ...paras];
    } else {
      const item: BookSectionItem = {
        id: row.id,
        number: row.item_number || toBanglaDigits(row.item_order),
        board: row.board_tag || undefined,
        ...(content as Partial<BookSectionItem>),
      };
      secEntry.section.items = [...(secEntry.section.items || []), item];
    }
  }

  const chapters: BookChapter[] = Array.from(chaptersMap.values())
    .sort((a, b) => a.chapterOrder - b.chapterOrder)
    .map((entry) => {
      entry.chapter.sections = Array.from(entry.sectionsMap.values())
        .sort((a, b) => a.sectionOrder - b.sectionOrder)
        .map((s) => s.section);
      return entry.chapter;
    });

  return {
    bookTitle: subject.book_title,
    runningHeaderTop: subject.running_header_top,
    runningHeaderBanner: subject.running_header_banner,
    defaultPageSize: subject.default_page_size === 'a4' ? 'a4' : 'letter',
    startPageNumber: subject.start_page_number || 1,
    includeBlankIntroPages: Boolean(subject.include_blank_intro_pages),
    chapters,
  };
}

export async function getSubjectWorkspaceData(slug: string) {
  const subject = await getSubjectBySlug(slug);
  if (!subject) return null;
  const rows = await getSubjectRows(subject.table_name);
  const chapters = extractChaptersSummary(rows);
  const items = rows.filter((r) => r.record_kind === 'item');
  const bookData = rowsToBookData(subject, rows);
  return { subject, chapters, items, bookData };
}

export function getDefaultSectionMeta(type: SectionType) {
  return SECTION_FORMAT_MAP[type];
}
