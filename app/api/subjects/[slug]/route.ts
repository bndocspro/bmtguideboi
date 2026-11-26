import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getSubjectBySlug, getSubjectWorkspaceData } from '@/lib/queries';

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await context.params;
  const data = await getSubjectWorkspaceData(slug);
  if (!data) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await context.params;
  const existing = await getSubjectBySlug(slug);
  if (!existing) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const bookTitle = String(body.book_title ?? existing.book_title);
  const rhTop = String(body.running_header_top ?? existing.running_header_top);
  const rhBanner = String(body.running_header_banner ?? existing.running_header_banner);
  const pageSize = body.default_page_size === 'a4' ? 'a4' : 'letter';
  const defaultFont = String(body.default_font ?? existing.default_font);
  const defaultFontSize = String(body.default_font_size ?? existing.default_font_size);
  const startPage = Math.max(1, Number(body.start_page_number ?? existing.start_page_number) || 1);
  const includeBlank = Boolean(
    body.include_blank_intro_pages !== undefined
      ? body.include_blank_intro_pages
      : existing.include_blank_intro_pages
  );

  const updated = await sql`
    UPDATE public.bmt_subjects
    SET
      book_title = ${bookTitle},
      running_header_top = ${rhTop},
      running_header_banner = ${rhBanner},
      default_page_size = ${pageSize},
      default_font = ${defaultFont},
      default_font_size = ${defaultFontSize},
      start_page_number = ${startPage},
      include_blank_intro_pages = ${includeBlank},
      updated_at = now()
    WHERE slug = ${slug}
    RETURNING *
  `;

  return NextResponse.json({ subject: updated[0] });
}
