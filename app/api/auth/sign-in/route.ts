import { NextResponse } from 'next/server';
import { signInWithCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const result = await signInWithCredentials(
    String(body.email || ''),
    String(body.password || '')
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: result.user });
}
