/**
 * Always hit the same-origin Next.js proxy at /api/*. The Next.js
 * `rewrites()` config in next.config.ts forwards these requests to the real
 * backend on Railway. This keeps auth cookies first-party (casolisto.online)
 * and avoids browser blocks on third-party cookies.
 *
 * Do NOT switch this back to NEXT_PUBLIC_API_URL — the env var is now only
 * read by the Next.js rewrite destination, not by the frontend bundle.
 */
export const API_URL = '/api';

/**
 * The backend enforces cookie-only authentication. We just set
 * `credentials: 'include'` and let the browser attach the httpOnly cookies;
 * JavaScript cannot read or modify them.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    // Access token expired or missing — try a single silent refresh.
    // HeadersInit is a union (Headers | string[][] | Record<string, string>),
    // so it doesn't support arbitrary string indexing. We always coerce to a
    // plain Record before reading or writing custom headers.
    const optHeaders = (options.headers as Record<string, string> | undefined) ?? {};
    if (path !== '/auth/refresh' && !optHeaders['x-refreshed']) {
      const refreshed = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshed.ok) {
        const retryHeaders: Record<string, string> = {
          ...headers,
          'x-refreshed': '1',
        };
        return request<T>(path, { ...options, headers: retryHeaders });
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
