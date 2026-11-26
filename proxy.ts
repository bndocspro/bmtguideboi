import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'bmt_admin_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hard-block any sign-up path so there is strictly NO sign-up option
  if (pathname === '/sign-up' || pathname.startsWith('/auth/sign-up') || pathname === '/register') {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Allow sign-in and auth API routes
  if (pathname === '/sign-in' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const hasLocalSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const hasNeonAuthSession = request.cookies
    .getAll()
    .some((c) => c.name.includes('neon-auth.session_token') && Boolean(c.value));

  if (!hasLocalSession && !hasNeonAuthSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|font/|assets/|.*\\.svg$|.*\\.ttf$).*)',
  ],
};
