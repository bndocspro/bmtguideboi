export type ClassYear = 11 | 12;

export type SectionType =
  | 'bio'
  | 'prose'
  | 'knowledge'
  | 'comprehension'
  | 'creative'
  | 'mcq'
  | 'broad'
  | 'table_note';

export type PageSizeOption = 'letter' | 'a4';

export interface SubjectRecord {
  id: number;
  slug: string;
  table_name: string;
  class_year: ClassYear;
  class_label: string;
  name_bn: string;
  name_en: string;
  subject_code: string;
  category: string;
  book_title: string;
  running_header_top: string;
  running_header_banner: string;
  default_page_size: PageSizeOption;
  default_font: string;
  default_font_size: string;
  start_page_number: number;
  include_blank_intro_pages: boolean;
  sort_order: number;
  chapter_count?: number;
  item_count?: number;
}

export interface BioContent {
  label: string;
  value: string;
  labelStyle?: 'normal' | 'bold-italic';
}

export interface ProseContent {
  paragraphs: string[];
}

export interface KnowledgeContent {
  question: string;
  answer: string;
}

export interface ComprehensionContent {
  question: string;
  answerParagraphs: string[];
}

export interface CreativeSubQuestion {
  label: string;
  text: string;
}

export interface CreativeSubAnswer {
  label: string;
  paragraphs: string[];
}

export interface CreativeContent {
  stimulus: string;
  subQuestions: CreativeSubQuestion[];
  answerHeading: string;
  subAnswers: CreativeSubAnswer[];
}

export interface McqOption {
  label: string;
  text: string;
}

export interface McqContent {
  question: string;
  options: McqOption[];
  correctOption: string;
  explanation?: string;
}

export interface BroadContent {
  question: string;
  marks?: string;
  answerParagraphs: string[];
}

export interface TableNoteContent {
  title?: string;
  description?: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export type GuideItemContent =
  | BioContent
  | ProseContent
  | KnowledgeContent
  | ComprehensionContent
  | CreativeContent
  | McqContent
  | BroadContent
  | TableNoteContent;

export interface GuideDbRow {
  id: string;
  record_kind: 'chapter' | 'item';
  chapter_key: string;
  chapter_number: string;
  chapter_title: string;
  chapter_author: string;
  chapter_part: string;
  chapter_order: number;
  section_type: SectionType;
  section_title: string;
  header_svg: string;
  columns: 1 | 2;
  section_order: number;
  item_order: number;
  item_number: string;
  board_tag: string;
  content: GuideItemContent | Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuideChapterSummary {
  chapter_key: string;
  chapter_number: string;
  chapter_title: string;
  chapter_author: string;
  chapter_part: string;
  chapter_order: number;
  item_count: number;
}

/** Normalized book JSON shape consumed by the pagination & print engine */
export interface BookSectionItem {
  id?: string;
  number?: string;
  board?: string;
  columns?: 1 | 2;
  // bio
  label?: string;
  value?: string;
  labelStyle?: string;
  // knowledge & comprehension & broad & mcq
  question?: string;
  answer?: string;
  answerParagraphs?: string[];
  marks?: string;
  // creative
  stimulus?: string;
  subQuestions?: CreativeSubQuestion[];
  answerHeading?: string;
  subAnswers?: CreativeSubAnswer[];
  // mcq
  options?: McqOption[];
  correctOption?: string;
  explanation?: string;
  // table_note
  title?: string;
  description?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
}

export interface BookSection {
  type: SectionType;
  title: string;
  headerSvg?: string;
  columns: 1 | 2;
  paragraphs?: string[];
  items?: BookSectionItem[];
}

export interface BookChapter {
  id: string;
  chapterNumber: string;
  title: string;
  author?: string;
  part?: string;
  sections: BookSection[];
}

export interface BookData {
  bookTitle: string;
  runningHeaderTop: string;
  runningHeaderBanner: string;
  defaultPageSize: PageSizeOption;
  startPageNumber: number;
  includeBlankIntroPages: boolean;
  chapters: BookChapter[];
}
