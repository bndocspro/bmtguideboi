import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSubjectWorkspaceData } from '@/lib/queries';
import { BookPrintViewer } from '@/components/book/book-print-viewer';

async function PrintViewContent({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
  searchParamsPromise: Promise<{ chapter?: string }>;
}) {
  await requireAdmin();
  const { slug } = await paramsPromise;
  const search = await searchParamsPromise;
  const data = await getSubjectWorkspaceData(slug);
  if (!data) notFound();

  return (
    <BookPrintViewer
      subject={data.subject}
      bookData={data.bookData}
      initialChapterId={search.chapter || 'all'}
    />
  );
}

export default function SubjectPrintViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e5e9f0] text-sm text-slate-700">
          প্রিন্ট লেআউট ও পৃষ্ঠাসমূহ প্রস্তুত হচ্ছে...
        </div>
      }
    >
      <PrintViewContent paramsPromise={params} searchParamsPromise={searchParams} />
    </Suspense>
  );
}
