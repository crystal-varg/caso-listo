import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Rutas admin — la verificación de auth la hace el layout client-side.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
