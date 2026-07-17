import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const cookieName = 'rewise_anonymous_id';
  let anonymousId = request.cookies.get(cookieName)?.value;
  let response: NextResponse;

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    
    // Clone request headers and set the cookie in the incoming request
    // so that the server components in this request can read it immediately.
    const requestHeaders = new Headers(request.headers);
    const existingCookie = request.headers.get('cookie') || '';
    const newCookieStr = existingCookie 
      ? `${existingCookie}; ${cookieName}=${anonymousId}`
      : `${cookieName}=${anonymousId}`;
    requestHeaders.set('cookie', newCookieStr);

    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set the cookie on the response so the browser stores it
    response.cookies.set({
      name: cookieName,
      value: anonymousId,
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      sameSite: 'lax',
    });
  } else {
    response = NextResponse.next();
  }

  return response;
}

export const config = {
  matcher: [
    // Apply proxy to all routes except API, static assets, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
