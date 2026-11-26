import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { SignInForm } from '@/components/auth/sign-in-form';

async function SignInGate() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect('/');
  }
  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
          লোড হচ্ছে...
        </div>
      }
    >
      <SignInGate />
    </Suspense>
  );
}
