import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/register', '/forgot-password'];

  if (
    pathname === '/' ||
    publicPaths.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // Indicador de sesión (los tokens están en cookies httpOnly que valida el backend)
  const hasSession = request.cookies.get('tsuma_session')?.value === '1';

  if (!hasSession && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
