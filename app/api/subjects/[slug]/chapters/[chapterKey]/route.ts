import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { assertValidTableName, getPool } from '@/lib/db';
import { getSubjectBySlug } from '@/lib/queries';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string; chapterKey: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, chapterKey } = await context.params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const safeTable = assertValidTableName(subject.table_name);
  const pool = getPool();
  const body = (await req.json()) as Record<string, unknown>;

  const title = String(body.chapter_title || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'অধ্যায়ের শিরোনাম আবশ্যক।' }, { status: 400 });
  }

  const chapterNumber = String(body.chapter_number || '').trim();
  const chapterAuthor = String(body.chapter_author || '').trim();
  const chapterPart = String(body.chapter_part || '').trim();

  await pool.query(
    `
      UPDATE public."${safeTable}"
      SET
        chapter_number = $1,
        chapter_title = $2,
        chapter_author = $3,
        chapter_part = $4,
        updated_at = now()
      WHERE chapter_key = $5
    `,
    [chapterNumber, title, chapterAuthor, chapterPart, decodeURIComponent(chapterKey)]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ slug: string; chapterKey: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, chapterKey } = await context.params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const safeTable = assertValidTableName(subject.table_name);
  const pool = getPool();

  await pool.query(
    `DELETE FROM public."${safeTable}" WHERE chapter_key = $1`,
    [decodeURIComponent(chapterKey)]
  );

  return NextResponse.json({ ok: true });
}
