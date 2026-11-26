import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { assertValidTableName, getPool } from '@/lib/db';
import { getSubjectBySlug } from '@/lib/queries';
import { SECTION_FORMAT_MAP, toBanglaDigits } from '@/lib/subjects';
import type { SectionType } from '@/lib/types';

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await context.params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const safeTable = assertValidTableName(subject.table_name);
  const pool = getPool();
  const body = (await req.json()) as Record<string, unknown>;

  const chapterKey = String(body.chapter_key || '').trim();
  const sectionType = String(body.section_type || 'knowledge') as SectionType;
  const meta = SECTION_FORMAT_MAP[sectionType];
  if (!chapterKey || !meta) {
    return NextResponse.json({ error: 'অধ্যায় বা ফরম্যাট সঠিক নয়।' }, { status: 400 });
  }

  // Look up chapter metadata inside this subject's table
  const chRes = await pool.query(
    `
      SELECT chapter_number, chapter_title, chapter_author, chapter_part, chapter_order
      FROM public."${safeTable}"
      WHERE chapter_key = $1
      ORDER BY record_kind ASC
      LIMIT 1
    `,
    [chapterKey]
  );

  if (chRes.rows.length === 0) {
    return NextResponse.json({ error: 'অধ্যায়টি পাওয়া যায়নি।' }, { status: 404 });
  }

  const ch = chRes.rows[0] as {
    chapter_number: string;
    chapter_title: string;
    chapter_author: string;
    chapter_part: string;
    chapter_order: number;
  };

  const sectionTitle = String(body.section_title || '').trim() || meta.labelBn;
  const headerSvg =
    body.header_svg !== undefined ? String(body.header_svg) : meta.defaultHeaderSvg;
  const columns = Number(body.columns) === 2 ? 2 : Number(body.columns) === 1 ? 1 : meta.defaultColumns;
  const boardTag = String(body.board_tag || '').trim();

  // Compute section_order & next item_order cleanly
  const secOrderRes = await pool.query(
    `
      SELECT
        COALESCE(MIN(section_order) FILTER (WHERE section_type = $2 AND record_kind = 'item'), 0)::int AS existing_sec_order,
        COALESCE(MAX(item_order) FILTER (WHERE section_type = $2 AND record_kind = 'item'), 0)::int AS max_item_order
      FROM public."${safeTable}"
      WHERE chapter_key = $1
    `,
    [chapterKey, sectionType]
  );

  const existingSecOrder = Number(secOrderRes.rows[0]?.existing_sec_order || 0);
  const maxItemOrder = Number(secOrderRes.rows[0]?.max_item_order || 0);
  const sectionOrder = existingSecOrder > 0 ? existingSecOrder : meta.order;
  const itemOrder = maxItemOrder + 1;
  const itemNumber = String(body.item_number || '').trim() || toBanglaDigits(itemOrder);
  const content = body.content && typeof body.content === 'object' ? body.content : {};

  const { rows } = await pool.query(
    `
      INSERT INTO public."${safeTable}" (
        record_kind, chapter_key, chapter_number, chapter_title, chapter_author,
        chapter_part, chapter_order, section_type, section_title, header_svg,
        columns, section_order, item_order, item_number, board_tag, content
      ) VALUES (
        'item', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
      )
      RETURNING *
    `,
    [
      chapterKey,
      ch.chapter_number,
      ch.chapter_title,
      ch.chapter_author,
      ch.chapter_part,
      ch.chapter_order,
      sectionType,
      sectionTitle,
      headerSvg,
      columns,
      sectionOrder,
      itemOrder,
      itemNumber,
      boardTag,
      JSON.stringify(content),
    ]
  );

  return NextResponse.json({ item: rows[0] }, { status: 201 });
}
