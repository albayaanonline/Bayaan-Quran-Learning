const _base = ((import.meta.env.VITE_API_BASE_URL as string) || "").replace(/\/$/, "");

export const API_BASE = _base;

let _getToken: (() => Promise<string | null> | string | null) | null = null;

export function setApiTokenGetter(fn: (() => Promise<string | null> | string | null) | null) {
  _getToken = fn;
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const resolvedUrl = url.startsWith("/") && _base ? `${_base}${url}` : url;
  const headers = new Headers((init.headers as HeadersInit) ?? {});

  if (!headers.has("authorization") && _getToken) {
    const token = await _getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const { credentials: _creds, ...rest } = init as RequestInit & { credentials?: string };
  return fetch(resolvedUrl, { ...rest, headers });
}
