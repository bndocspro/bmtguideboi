import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { assertValidTableName, getPool } from '@/lib/db';
import { getSubjectBySlug } from '@/lib/queries';
import { SECTION_FORMAT_MAP } from '@/lib/subjects';
import type { SectionType } from '@/lib/types';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string; itemId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, itemId } = await context.params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const safeTable = assertValidTableName(subject.table_name);
  const pool = getPool();
  const body = (await req.json()) as Record<string, unknown>;

  // Action: swap order with neighbor or toggle column mode for whole section
  if (body.action === 'set_section_columns') {
    const chapterKey = String(body.chapter_key || '');
    const sectionType = String(body.section_type || '');
    const columns = Number(body.columns) === 2 ? 2 : 1;
    await pool.query(
      `
        UPDATE public."${safeTable}"
        SET columns = $1, updated_at = now()
        WHERE chapter_key = $2 AND section_type = $3 AND record_kind = 'item'
      `,
      [columns, chapterKey, sectionType]
    );
    return NextResponse.json({ ok: true });
  }

  const existingRes = await pool.query(
    `SELECT * FROM public."${safeTable}" WHERE id = $1::uuid LIMIT 1`,
    [itemId]
  );
  if (existingRes.rows.length === 0) {
    return NextResponse.json({ error: 'আইটেম পাওয়া যায়নি।' }, { status: 404 });
  }
  const cur = existingRes.rows[0];

  const sectionType = (body.section_type ?? cur.section_type) as SectionType;
  const meta = SECTION_FORMAT_MAP[sectionType];
  if (!meta) return NextResponse.json({ error: 'Invalid section type' }, { status: 400 });

  const sectionTitle =
    body.section_title !== undefined ? String(body.section_title).trim() : cur.section_title;
  const headerSvg =
    body.header_svg !== undefined ? String(body.header_svg) : cur.header_svg;
  const columns =
    body.columns !== undefined ? (Number(body.columns) === 2 ? 2 : 1) : cur.columns;
  const itemOrder =
    body.item_order !== undefined ? Number(body.item_order) : cur.item_order;
  const itemNumber =
    body.item_number !== undefined ? String(body.item_number).trim() : cur.item_number;
  const boardTag =
    body.board_tag !== undefined ? String(body.board_tag).trim() : cur.board_tag;
  const isPublished =
    body.is_published !== undefined ? Boolean(body.is_published) : cur.is_published;
  const content =
    body.content && typeof body.content === 'object' ? body.content : cur.content;

  const { rows } = await pool.query(
    `
      UPDATE public."${safeTable}"
      SET
        section_type = $1,
        section_title = $2,
        header_svg = $3,
        columns = $4,
        item_order = $5,
        item_number = $6,
        board_tag = $7,
        is_published = $8,
        content = $9::jsonb,
        updated_at = now()
      WHERE id = $10::uuid
      RETURNING *
    `,
    [
      sectionType,
      sectionTitle,
      headerSvg,
      columns,
      itemOrder,
      itemNumber,
      boardTag,
      isPublished,
      JSON.stringify(content),
      itemId,
    ]
  );

  return NextResponse.json({ item: rows[0] });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ slug: string; itemId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, itemId } = await context.params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const safeTable = assertValidTableName(subject.table_name);
  const pool = getPool();

  await pool.query(
    `DELETE FROM public."${safeTable}" WHERE id = $1::uuid AND record_kind = 'item'`,
    [itemId]
  );

  return NextResponse.json({ ok: true });
}
