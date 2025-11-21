// Simple helper route to set a client‑side auth cookie from a Firebase ID token.
// This is meant for development/testing only and does not validate the token.
// A backend engineer should replace this with a secure session implementation.

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();

  const response = NextResponse.json({ ok: true });

  // When a token is present, set the cookie. When null, clear it.
  if (token) {
    response.cookies.set('firebaseAuthToken', token, {
      httpOnly: false, // intentionally readable by the client in this prototype
      sameSite: 'lax',
      path: '/',
    });
  } else {
    response.cookies.set('firebaseAuthToken', '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

