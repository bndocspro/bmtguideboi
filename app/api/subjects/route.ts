import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllSubjectsWithStats } from '@/lib/queries';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subjects = await getAllSubjectsWithStats();
  return NextResponse.json({ subjects });
}
