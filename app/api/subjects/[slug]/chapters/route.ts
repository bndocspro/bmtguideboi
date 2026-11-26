import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { assertValidTableName, getPool } from '@/lib/db';
import { getSubjectBySlug } from '@/lib/queries';
import { toBanglaDigits } from '@/lib/subjects';

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

  const title = String(body.chapter_title || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'অধ্যায়ের শিরোনাম আবশ্যক।' }, { status: 400 });
  }

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX(chapter_order), 0)::int AS max_order FROM public."${safeTable}"`
  );
  const nextOrder = Number(maxRes.rows[0]?.max_order || 0) + 1;

  const chapterNumber = String(body.chapter_number || '').trim() || toBanglaDigits(nextOrder);
  const chapterAuthor = String(body.chapter_author || '').trim();
  const chapterPart = String(body.chapter_part || '').trim();
  const chapterKey =
    String(body.chapter_key || '').trim() ||
    `chapter-${nextOrder}-${Date.now().toString(36)}`;

  const { rows } = await pool.query(
    `
      INSERT INTO public."${safeTable}" (
        record_kind, chapter_key, chapter_number, chapter_title, chapter_author,
        chapter_part, chapter_order, section_type, section_title, header_svg,
        columns, section_order, item_order, item_number, board_tag, content
      ) VALUES (
        'chapter', $1, $2, $3, $4, $5, $6, 'prose', $3, '', 1, 0, 0, '', '', '{}'::jsonb
      )
      RETURNING *
    `,
    [chapterKey, chapterNumber, title, chapterAuthor, chapterPart, nextOrder]
  );

  return NextResponse.json({ chapter: rows[0] }, { status: 201 });
}
