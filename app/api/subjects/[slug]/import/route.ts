import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { assertValidTableName, getPool } from '@/lib/db';
import { getSubjectBySlug } from '@/lib/queries';
import { SECTION_FORMAT_MAP, toBanglaDigits } from '@/lib/subjects';
import type { BookData, SectionType } from '@/lib/types';

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
  const body = (await req.json()) as { bookData: BookData; replace?: boolean };

  const book = body.bookData;
  if (!book || !Array.isArray(book.chapters)) {
    return NextResponse.json({ error: 'সঠিক Book JSON ফরম্যাট নয়।' }, { status: 400 });
  }

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX(chapter_order), 0)::int AS max_order FROM public."${safeTable}"`
  );
  const baseOrder = body.replace ? 0 : Number(maxRes.rows[0]?.max_order || 0);

  const rowsToInsert: Array<Record<string, unknown>> = [];
  book.chapters.forEach((ch, chIdx) => {
    const chOrder = baseOrder + chIdx + 1;
    const chKey = body.replace
      ? ch.id || `chapter-${chOrder}`
      : `${ch.id || 'chapter'}-${Date.now().toString(36)}-${chIdx + 1}`;
    const chNum = ch.chapterNumber || toBanglaDigits(chOrder);
    const chTitle = ch.title || 'শিরোনামহীন';
    const chAuthor = ch.author || '';
    const chPart = ch.part || '';

    rowsToInsert.push({
      record_kind: 'chapter',
      chapter_key: chKey,
      chapter_number: chNum,
      chapter_title: chTitle,
      chapter_author: chAuthor,
      chapter_part: chPart,
      chapter_order: chOrder,
      section_type: 'prose',
      section_title: chTitle,
      header_svg: '',
      columns: 1,
      section_order: 0,
      item_order: 0,
      item_number: '',
      board_tag: '',
      content: {},
    });

    (ch.sections || []).forEach((sec, secIdx) => {
      const secType = (SECTION_FORMAT_MAP[sec.type as SectionType] ? sec.type : 'knowledge') as SectionType;
      const meta = SECTION_FORMAT_MAP[secType];
      const secTitle = sec.title || meta.labelBn;
      const headerSvg = sec.headerSvg
        ? sec.headerSvg.startsWith('/')
          ? sec.headerSvg
          : '/' + sec.headerSvg
        : meta.defaultHeaderSvg;
      const cols = Number(sec.columns) === 2 ? 2 : 1;

      if (secType === 'prose') {
        rowsToInsert.push({
          record_kind: 'item',
          chapter_key: chKey,
          chapter_number: chNum,
          chapter_title: chTitle,
          chapter_author: chAuthor,
          chapter_part: chPart,
          chapter_order: chOrder,
          section_type: 'prose',
          section_title: secTitle,
          header_svg: headerSvg,
          columns: cols,
          section_order: secIdx + 1,
          item_order: 1,
          item_number: '১',
          board_tag: '',
          content: { paragraphs: sec.paragraphs || [] },
        });
      } else {
        (sec.items || []).forEach((item, itemIdx) => {
          const itemOrder = itemIdx + 1;
          const itemCopy = { ...item } as Record<string, unknown>;
          const number = itemCopy.number;
          const board = itemCopy.board;
          delete itemCopy.number;
          delete itemCopy.board;
          delete itemCopy.id;
          rowsToInsert.push({
            record_kind: 'item',
            chapter_key: chKey,
            chapter_number: chNum,
            chapter_title: chTitle,
            chapter_author: chAuthor,
            chapter_part: chPart,
            chapter_order: chOrder,
            section_type: secType,
            section_title: secTitle,
            header_svg: headerSvg,
            columns: cols,
            section_order: secIdx + 1,
            item_order: itemOrder,
            item_number: String(number || toBanglaDigits(itemOrder)),
            board_tag: String(board || ''),
            content: itemCopy,
          });
        });
      }
    });
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (body.replace) {
      await client.query(`TRUNCATE TABLE public."${safeTable}"`);
    }
    if (rowsToInsert.length > 0) {
      await client.query(
        `
          INSERT INTO public."${safeTable}" (
            record_kind, chapter_key, chapter_number, chapter_title, chapter_author,
            chapter_part, chapter_order, section_type, section_title, header_svg,
            columns, section_order, item_order, item_number, board_tag, content
          )
          SELECT
            r.record_kind, r.chapter_key, r.chapter_number, r.chapter_title, r.chapter_author,
            r.chapter_part, r.chapter_order, r.section_type, r.section_title, r.header_svg,
            r.columns, r.section_order, r.item_order, r.item_number, r.board_tag, r.content
          FROM jsonb_to_recordset($1::jsonb) AS r(
            record_kind text,
            chapter_key text,
            chapter_number text,
            chapter_title text,
            chapter_author text,
            chapter_part text,
            chapter_order int,
            section_type text,
            section_title text,
            header_svg text,
            columns smallint,
            section_order int,
            item_order int,
            item_number text,
            board_tag text,
            content jsonb
          )
        `,
        [JSON.stringify(rowsToInsert)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true, inserted: rowsToInsert.length });
}
