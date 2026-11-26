import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createNeonAuth } from '@neon/auth/next/server';
import { sql } from './db';

export const SESSION_COOKIE_NAME = 'bmt_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  source: 'db' | 'neon_auth';
}

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || 'bmt-guide-boi-fallback-dev-secret-key';
}

function signToken(rawToken: string): string {
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(rawToken).digest('base64url');
  return `${rawToken}.${sig}`;
}

function verifySignedToken(cookieValue: string): string | null {
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;
  const rawToken = cookieValue.slice(0, dot);
  const providedSig = cookieValue.slice(dot + 1);
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(rawToken).digest('base64url');
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return rawToken;
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getNeonAuthInstance() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) return null;
  return createNeonAuth({
    baseUrl,
    cookies: { secret },
    logLevel: 'silent',
  });
}

export async function signInWithCredentials(
  emailInput: string,
  password: string
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) {
    return { ok: false, error: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' };
  }

  // 1. Check public.admin_users (using pgcrypto crypt verification)
  try {
    const rows = await sql`
      SELECT id, email, name, role
      FROM public.admin_users
      WHERE lower(email) = ${email}
        AND is_active = true
        AND password_hash = crypt(${password}, password_hash)
      LIMIT 1
    `;

    if (rows.length > 0) {
      const user = rows[0] as { id: string; email: string; name: string; role: string };
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await sql`
        INSERT INTO public.admin_sessions (user_id, token_hash, expires_at)
        VALUES (${user.id}::uuid, ${tokenHash}, ${expiresAt.toISOString()}::timestamptz)
      `;

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, signToken(rawToken), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: expiresAt,
      });

      return {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, source: 'db' },
      };
    }
  } catch (err) {
    console.error('admin_users login check error:', err);
  }

  // 2. Fallback: Check Managed Neon Auth (in case user was created in Neon Auth Console)
  try {
    const neonAuth = getNeonAuthInstance();
    if (neonAuth) {
      const { data, error } = await neonAuth.signIn.email({ email, password });
      if (!error && data?.user) {
        return {
          ok: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || 'Admin',
            role: 'admin',
            source: 'neon_auth',
          },
        };
      }
    }
  } catch (err) {
    console.error('Neon Auth login fallback error:', err);
  }

  return { ok: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।' };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (rawCookie) {
      const rawToken = verifySignedToken(rawCookie);
      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        const rows = await sql`
          SELECT u.id, u.email, u.name, u.role
          FROM public.admin_sessions s
          JOIN public.admin_users u ON u.id = s.user_id
          WHERE s.token_hash = ${tokenHash}
            AND s.expires_at > now()
            AND u.is_active = true
          LIMIT 1
        `;
        if (rows.length > 0) {
          const u = rows[0] as { id: string; email: string; name: string; role: string };
          return { id: u.id, email: u.email, name: u.name, role: u.role, source: 'db' };
        }
      }
    }

    // Only check Neon Auth session if a Neon Auth cookie is present
    const hasNeonAuthCookie = cookieStore
      .getAll()
      .some((c) => c.name.includes('neon-auth.session_token'));
    if (hasNeonAuthCookie) {
      const neonAuth = getNeonAuthInstance();
      if (neonAuth) {
        const { data } = await neonAuth.getSession();
        if (data?.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || 'Admin',
            role: 'admin',
            source: 'neon_auth',
          };
        }
      }
    }
  } catch (err) {
    const anyErr = err as { digest?: string; sourceError?: { digest?: string } } | null;
    const digest = anyErr?.digest || anyErr?.sourceError?.digest || '';
    if (String(digest).includes('HANGING_PROMISE') || String(digest).includes('NEXT_')) {
      throw err;
    }
    console.error('getCurrentAdmin error:', err);
  }

  return null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/sign-in');
  }
  return admin;
}

export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawCookie) {
    const rawToken = verifySignedToken(rawCookie);
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await sql`DELETE FROM public.admin_sessions WHERE token_hash = ${tokenHash}`.catch(() => {});
    }
  }
  cookieStore.delete(SESSION_COOKIE_NAME);

  try {
    const neonAuth = getNeonAuthInstance();
    if (neonAuth) {
      await neonAuth.signOut();
    }
  } catch {
    // Ignore if no neon_auth session exists
  }
}
