import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSubjectWorkspaceData } from '@/lib/queries';
import { SubjectWorkspaceClient } from '@/components/subject/subject-workspace-client';

async function SubjectWorkspaceContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const admin = await requireAdmin();
  const { slug } = await paramsPromise;
  const data = await getSubjectWorkspaceData(slug);
  if (!data) notFound();

  return (
    <SubjectWorkspaceClient
      admin={admin}
      subject={data.subject}
      chapters={data.chapters}
      items={data.items}
      bookData={data.bookData}
    />
  );
}

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-sm text-slate-500">
          বিষয়ের তথ্য লোড হচ্ছে...
        </div>
      }
    >
      <SubjectWorkspaceContent paramsPromise={params} />
    </Suspense>
  );
}
