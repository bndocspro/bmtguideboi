import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBanglaDigits = (n) => String(n).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)]);

async function main() {
  const bookPath = path.resolve(process.cwd(), '..', 'data', 'book.json');
  const raw = fs.readFileSync(bookPath, 'utf8');
  const book = JSON.parse(raw);

  const existing = await sql`SELECT COUNT(*)::int AS cnt FROM public.bmt_12_bangla_2`;
  if (existing[0]?.cnt > 0) {
    console.log(`bmt_12_bangla_2 already has ${existing[0].cnt} rows. Skipping seed.`);
    return;
  }

  const rows = [];
  const chapters = book.chapters || [];

  chapters.forEach((ch, chIdx) => {
    const chOrder = chIdx + 1;
    const chKey = ch.id || `chapter-${chOrder}`;
    const chNum = ch.chapterNumber || toBanglaDigits(chOrder);
    const chTitle = ch.title || 'শিরোনামহীন';
    const chAuthor = ch.author || '';
    const chPart = ch.part || '';

    // Chapter definition row
    rows.push({
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
      const secOrder = secIdx + 1;
      const secType = sec.type || 'knowledge';
      const secTitle = sec.title || '';
      const headerSvg = sec.headerSvg ? (sec.headerSvg.startsWith('/') ? sec.headerSvg : '/' + sec.headerSvg) : '';
      const cols = Number(sec.columns) === 2 ? 2 : 1;

      if (secType === 'prose') {
        rows.push({
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
          section_order: secOrder,
          item_order: 1,
          item_number: '১',
          board_tag: '',
          content: { paragraphs: sec.paragraphs || [] },
        });
      } else {
        (sec.items || []).forEach((item, itemIdx) => {
          const itemOrder = itemIdx + 1;
          let content = {};
          if (secType === 'bio') {
            content = {
              label: item.label || '',
              value: item.value || '',
              labelStyle: item.labelStyle === 'bold-italic' ? 'bold-italic' : 'normal',
            };
          } else if (secType === 'knowledge') {
            content = {
              question: item.question || '',
              answer: item.answer || '',
            };
          } else if (secType === 'comprehension') {
            content = {
              question: item.question || '',
              answerParagraphs: item.answerParagraphs || (item.answer ? [item.answer] : []),
            };
          } else if (secType === 'creative') {
            content = {
              stimulus: item.stimulus || '',
              subQuestions: item.subQuestions || [],
              answerHeading: item.answerHeading || `${item.number || toBanglaDigits(itemOrder)} নং সৃজনশীল প্রশ্নের উত্তর`,
              subAnswers: item.subAnswers || [],
            };
          } else {
            content = item;
          }

          rows.push({
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
            section_order: secOrder,
            item_order: itemOrder,
            item_number: item.number || toBanglaDigits(itemOrder),
            board_tag: item.board || '',
            content,
          });
        });
      }
    });
  });

  console.log(`Prepared ${rows.length} rows across ${chapters.length} chapters. Inserting in batches...`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const payload = JSON.stringify(batch);
    await sql`
      INSERT INTO public.bmt_12_bangla_2 (
        record_kind, chapter_key, chapter_number, chapter_title, chapter_author, chapter_part, chapter_order,
        section_type, section_title, header_svg, columns, section_order, item_order, item_number, board_tag, content
      )
      SELECT
        r.record_kind, r.chapter_key, r.chapter_number, r.chapter_title, r.chapter_author, r.chapter_part, r.chapter_order,
        r.section_type, r.section_title, r.header_svg, r.columns, r.section_order, r.item_order, r.item_number, r.board_tag, r.content
      FROM jsonb_to_recordset(${payload}::jsonb) AS r(
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
    `;
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}`);
  }

  console.log('Seed completed successfully!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
