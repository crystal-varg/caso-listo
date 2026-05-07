import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  // Rutas admin — no procesar como tenant
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Extraer slug del subdominio
  // zuazquita.casolisto.com → "zuazquita"
  // casolisto.online → null
  // localhost:3000 → null
  const dominios_base = [
    'casolisto.online',
    'casolisto.com',
    'localhost:3000',
    'localhost:3001',
    'steadfast-sparkle.up.railway.app',
    'steadfast-sparkle-production-2119.up.railway.app',
  ];

  let tenantSlug: string | null = null;
  for (const base of dominios_base) {
    if (host.endsWith('.' + base)) {
      tenantSlug = host.replace('.' + base, '').split('.')[0];
      break;
    }
  }

  const response = NextResponse.next();
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
