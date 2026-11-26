import type { SectionType } from './types';

export interface SubjectStaticDef {
  slug: string;
  tableName: string;
  classYear: 11 | 12;
  classLabel: string;
  nameBn: string;
  nameEn: string;
  subjectCode: string;
  category: string;
}

export const SUBJECT_CATALOG: SubjectStaticDef[] = [
  // একাদশ শ্রেণি (১ম বর্ষ) — ১২টি বিষয়
  {
    slug: 'class-11-bangla-1',
    tableName: 'bmt_11_bangla_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'বাংলা-১',
    nameEn: 'Bangla-1',
    subjectCode: '21111',
    category: 'ভাষা ও সাহিত্য',
  },
  {
    slug: 'class-11-english-1',
    tableName: 'bmt_11_english_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'ইংরেজি-১',
    nameEn: 'English-1',
    subjectCode: '21112',
    category: 'ভাষা ও সাহিত্য',
  },
  {
    slug: 'class-11-computer-office-app-1',
    tableName: 'bmt_11_computer_office_app_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'কম্পিউটার অফিস অ্যাপ্লিকেশন-১',
    nameEn: 'Computer Office Application-1',
    subjectCode: '21113',
    category: 'তথ্যপ্রযুক্তি',
  },
  {
    slug: 'class-11-business-math-stat',
    tableName: 'bmt_11_business_math_stat',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'ব্যবসায় গণিত ও পরিসংখ্যান',
    nameEn: 'Business Mathematics & Statistics',
    subjectCode: '21114',
    category: 'গণিত ও পরিসংখ্যান',
  },
  {
    slug: 'class-11-economics-comm-geo',
    tableName: 'bmt_11_economics_comm_geo',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'অর্থনীতি ও বাণিজ্যিক ভূগোল',
    nameEn: 'Economics & Commercial Geography',
    subjectCode: '21115',
    category: 'অর্থনীতি ও ভূগোল',
  },
  {
    slug: 'class-11-accounting-1',
    tableName: 'bmt_11_accounting_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'হিসাববিজ্ঞান নীতি ও প্রয়োগ-১',
    nameEn: 'Accounting Principles & Application-1',
    subjectCode: '21116',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },
  {
    slug: 'class-11-business-org-mgmt-1',
    tableName: 'bmt_11_business_org_mgmt_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা-১',
    nameEn: 'Business Organization & Management-1',
    subjectCode: '21117',
    category: 'ব্যবসায় ও ব্যবস্থাপনা',
  },
  {
    slug: 'class-11-marketing-1',
    tableName: 'bmt_11_marketing_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'মার্কেটিং নীতি ও প্রয়োগ-১',
    nameEn: 'Marketing Principles & Application-1',
    subjectCode: '21118',
    category: 'মার্কেটিং ও ই-বিজনেস',
  },
  {
    slug: 'class-11-computerized-accounting-1',
    tableName: 'bmt_11_computerized_accounting_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'কম্পিউটারাইজড অ্যাকাউন্টিং সিস্টেম-১',
    nameEn: 'Computerized Accounting System-1',
    subjectCode: '21121',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },
  {
    slug: 'class-11-digital-tech-business-1',
    tableName: 'bmt_11_digital_tech_business_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'ডিজিটাল টেকনোলজি ইন বিজনেস-১',
    nameEn: 'Digital Technology in Business-1',
    subjectCode: '21122',
    category: 'তথ্যপ্রযুক্তি',
  },
  {
    slug: 'class-11-hrm-1',
    tableName: 'bmt_11_hrm_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'হিউম্যান রিসোর্স ম্যানেজমেন্ট-১',
    nameEn: 'Human Resource Management-1',
    subjectCode: '21123',
    category: 'ব্যবসায় ও ব্যবস্থাপনা',
  },
  {
    slug: 'class-11-financial-customer-services-1',
    tableName: 'bmt_11_financial_customer_services_1',
    classYear: 11,
    classLabel: 'একাদশ শ্রেণি (১ম বর্ষ)',
    nameBn: 'ফিন্যান্সিয়াল কাস্টমার সার্ভিসেস-১',
    nameEn: 'Financial Customer Services-1',
    subjectCode: '21124',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },

  // দ্বাদশ শ্রেণি (২য় বর্ষ) — ১৩টি বিষয়
  {
    slug: 'class-12-bangla-2',
    tableName: 'bmt_12_bangla_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'বাংলা-২',
    nameEn: 'Bangla-2',
    subjectCode: '22111',
    category: 'ভাষা ও সাহিত্য',
  },
  {
    slug: 'class-12-english-2',
    tableName: 'bmt_12_english_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'ইংরেজি-২',
    nameEn: 'English-2',
    subjectCode: '22112',
    category: 'ভাষা ও সাহিত্য',
  },
  {
    slug: 'class-12-computer-office-app-2',
    tableName: 'bmt_12_computer_office_app_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'কম্পিউটার অফিস অ্যাপ্লিকেশন-২',
    nameEn: 'Computer Office Application-2',
    subjectCode: '22113',
    category: 'তথ্যপ্রযুক্তি',
  },
  {
    slug: 'class-12-business-english-comm',
    tableName: 'bmt_12_business_english_comm',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'বিজনেস ইংলিশ অ্যান্ড কমিউনিকেশন',
    nameEn: 'Business English & Communication',
    subjectCode: '22114',
    category: 'ভাষা ও যোগাযোগ',
  },
  {
    slug: 'class-12-office-management',
    tableName: 'bmt_12_office_management',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'অফিস ম্যানেজমেন্ট',
    nameEn: 'Office Management',
    subjectCode: '22115',
    category: 'ব্যবসায় ও ব্যবস্থাপনা',
  },
  {
    slug: 'class-12-accounting-2',
    tableName: 'bmt_12_accounting_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'হিসাববিজ্ঞান নীতি ও প্রয়োগ-২',
    nameEn: 'Accounting Principles & Application-2',
    subjectCode: '22116',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },
  {
    slug: 'class-12-business-org-mgmt-2',
    tableName: 'bmt_12_business_org_mgmt_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা-২',
    nameEn: 'Business Organization & Management-2',
    subjectCode: '22117',
    category: 'ব্যবসায় ও ব্যবস্থাপনা',
  },
  {
    slug: 'class-12-marketing-2',
    tableName: 'bmt_12_marketing_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'মার্কেটিং নীতি ও প্রয়োগ-২',
    nameEn: 'Marketing Principles & Application-2',
    subjectCode: '22118',
    category: 'মার্কেটিং ও ই-বিজনেস',
  },
  {
    slug: 'class-12-computerized-accounting-2',
    tableName: 'bmt_12_computerized_accounting_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'কম্পিউটারাইজড অ্যাকাউন্টিং সিস্টেম-২',
    nameEn: 'Computerized Accounting System-2',
    subjectCode: '22121',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },
  {
    slug: 'class-12-digital-tech-business-2',
    tableName: 'bmt_12_digital_tech_business_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'ডিজিটাল টেকনোলজি ইন বিজনেস-২',
    nameEn: 'Digital Technology in Business-2',
    subjectCode: '22122',
    category: 'তথ্যপ্রযুক্তি',
  },
  {
    slug: 'class-12-hrm-2',
    tableName: 'bmt_12_hrm_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'হিউম্যান রিসোর্স ম্যানেজমেন্ট-২',
    nameEn: 'Human Resource Management-2',
    subjectCode: '22123',
    category: 'ব্যবসায় ও ব্যবস্থাপনা',
  },
  {
    slug: 'class-12-financial-customer-services-2',
    tableName: 'bmt_12_financial_customer_services_2',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'ফিন্যান্সিয়াল কাস্টমার সার্ভিসেস-২',
    nameEn: 'Financial Customer Services-2',
    subjectCode: '22124',
    category: 'হিসাববিজ্ঞান ও অর্থ',
  },
  {
    slug: 'class-12-e-business-e-marketing',
    tableName: 'bmt_12_e_business_e_marketing',
    classYear: 12,
    classLabel: 'দ্বাদশ শ্রেণি (২য় বর্ষ)',
    nameBn: 'ই-বিজনেস ও ই-মার্কেটিং',
    nameEn: 'E-Business & E-Marketing',
    subjectCode: '22125',
    category: 'মার্কেটিং ও ই-বিজনেস',
  },
];

export const VALID_TABLE_NAMES = new Set(SUBJECT_CATALOG.map((s) => s.tableName));

export interface SectionFormatMeta {
  type: SectionType;
  labelBn: string;
  shortLabelBn: string;
  descriptionBn: string;
  defaultHeaderSvg: string;
  defaultColumns: 1 | 2;
  order: number;
}

export const SECTION_FORMATS: SectionFormatMeta[] = [
  {
    type: 'bio',
    labelBn: 'কবি / লেখক ও অধ্যায় পরিচিতি (তথ্য ছক)',
    shortLabelBn: 'পরিচিতি ছক',
    descriptionBn: 'নাম, জন্ম, পিতা, রচনা বা মূল তথ্যাবলির লেবেল-ভ্যালু ছক',
    defaultHeaderSvg: '/assets/poeam_bio.svg',
    defaultColumns: 1,
    order: 1,
  },
  {
    type: 'prose',
    labelBn: 'পাঠ পরিচিতি / মূলভাব / সারসংক্ষেপ',
    shortLabelBn: 'পাঠ পরিচিতি',
    descriptionBn: 'অনুচ্ছেদভিত্তিক আলোচনা, LaTeX সূত্র ও প্রবন্ধ সারসংক্ষেপ',
    defaultHeaderSvg: '/assets/lesson_bio.svg',
    defaultColumns: 1,
    order: 2,
  },
  {
    type: 'knowledge',
    labelBn: 'জ্ঞানমূলক / অতিসংক্ষিপ্ত প্রশ্ন ও উত্তর',
    shortLabelBn: 'জ্ঞানমূলক',
    descriptionBn: '১ নম্বরের সংক্ষিপ্ত প্রশ্ন ও উত্তর (১ বা ২ কলাম লেআউট)',
    defaultHeaderSvg: '/assets/knowledge_qna.svg',
    defaultColumns: 2,
    order: 3,
  },
  {
    type: 'comprehension',
    labelBn: 'অনুধাবনমূলক / সংক্ষিপ্ত প্রশ্ন ও উত্তর',
    shortLabelBn: 'অনুধাবনমূলক',
    descriptionBn: '২ নম্বরের ব্যাখ্যামূলক প্রশ্ন ও বহু-অনুচ্ছেদ উত্তর',
    defaultHeaderSvg: '/assets/comprehension_qna.svg',
    defaultColumns: 2,
    order: 4,
  },
  {
    type: 'creative',
    labelBn: 'সৃজনশীল প্রশ্ন ও উত্তর (CQ)',
    shortLabelBn: 'সৃজনশীল',
    descriptionBn: 'উদ্দীপক (টেবিল/LaTeX সহ) + ক, খ, গ, ঘ প্রশ্ন ও পূর্ণাঙ্গ উত্তর',
    defaultHeaderSvg: '/assets/cr_qna.svg',
    defaultColumns: 1,
    order: 5,
  },
  {
    type: 'mcq',
    labelBn: 'বহুনির্বাচনি প্রশ্ন ও উত্তর (MCQ)',
    shortLabelBn: 'বহুনির্বাচনি',
    descriptionBn: 'প্রশ্ন + ক/খ/গ/ঘ ৪টি বিকল্প, সঠিক উত্তর ও সংক্ষিপ্ত ব্যাখ্যা',
    defaultHeaderSvg: '',
    defaultColumns: 2,
    order: 6,
  },
  {
    type: 'broad',
    labelBn: 'রচনামূলক / গাণিতিক ও হিসাববিজ্ঞান সমস্যা',
    shortLabelBn: 'রচনামূলক / গাণিতিক',
    descriptionBn: 'বড় প্রশ্ন, গণিত-পরিসংখ্যান সমাধান (LaTeX) ও হিসাববিজ্ঞান ছক',
    defaultHeaderSvg: '',
    defaultColumns: 1,
    order: 7,
  },
  {
    type: 'table_note',
    labelBn: 'তুলনামূলক ছক / সূত্রাবলি / হিসাব সারণি',
    shortLabelBn: 'টেবিল / সূত্র ছক',
    descriptionBn: 'জাবেদা, খতিয়ান, রেওয়ামিল, পার্থক্য ছক বা গণসংখ্যা নিবেশন সারণি',
    defaultHeaderSvg: '',
    defaultColumns: 1,
    order: 8,
  },
];

export const SECTION_FORMAT_MAP = Object.fromEntries(
  SECTION_FORMATS.map((f) => [f.type, f])
) as Record<SectionType, SectionFormatMeta>;

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(val: string | number): string {
  return String(val).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)]);
}
