'use server';

import { redirect } from 'next/navigation';
import { signInWithCredentials, signOutAdmin } from '@/lib/auth';

export interface SignInState {
  error?: string;
}

export async function signInAction(
  _prevState: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  const result = await signInWithCredentials(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect('/');
}

export async function signOutAction(): Promise<void> {
  await signOutAdmin();
  redirect('/sign-in');
}
