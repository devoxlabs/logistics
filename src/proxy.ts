// Lightweight auth guard used as a replacement for Next.js middleware.
// NOTE: This is intentionally simple and only checks for the *presence* of a cookie.
// It should be replaced by a backend engineer with real session / token validation.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do NOT require a token.
const publicPaths = ['/login', '/signup'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.includes(pathname);
  const token = request.cookies.get('firebaseAuthToken')?.value;

  // If the user is not authenticated and hits a protected path, send them to login.
  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and hits a public path, send them to the dashboard.
  if (isPublic && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Otherwise, allow the request to continue.
  return NextResponse.next();
}

// Apply the proxy to the main dashboard and auth routes.
export const config = {
  matcher: ['/', '/login', '/signup'],
};

