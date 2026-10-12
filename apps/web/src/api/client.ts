export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: string[],
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'cmpc_token';

export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: { page: number; limit: number; total: number; totalPages: number } }> {
  const headers = new Headers(init.headers);
  const token = session.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...init, headers });
  if (response.status === 401 && !path.endsWith('/auth/login')) {
    session.clear();
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok || body.success === false) {
    const errors = Array.isArray(body.errors) ? body.errors : undefined;
    throw new ApiError(body.message || 'Error inesperado', response.status, errors);
  }
  return { data: body.data, meta: body.meta };
}

export async function download(path: string, filename: string) {
  const headers = new Headers();
  const token = session.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { headers });
  if (!response.ok) throw new ApiError('No se pudo exportar', response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
