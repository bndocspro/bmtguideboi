import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getAllSubjectsWithStats } from '@/lib/queries';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

async function DashboardContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ class?: string }>;
}) {
  const admin = await requireAdmin();
  const [subjects, sp] = await Promise.all([
    getAllSubjectsWithStats(),
    searchParamsPromise,
  ]);
  const initialClass =
    sp?.class === '11' ? '11' : sp?.class === '12' ? '12' : 'all';

  return (
    <DashboardClient
      admin={admin}
      subjects={subjects}
      initialClassFilter={initialClass}
    />
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-sm text-slate-500">
          সকল গাইড ও ডাটাবেজ টেবিল লোড হচ্ছে...
        </div>
      }
    >
      <DashboardContent searchParamsPromise={searchParams} />
    </Suspense>
  );
}
