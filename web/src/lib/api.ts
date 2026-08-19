const TOKEN_KEY = "pharmalytics_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      // FormData sets its own multipart Content-Type (with boundary) —
      // setting it manually here would drop that boundary.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  return res;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export async function fetchBlob(path: string): Promise<Blob> {
  const res = await request(path);
  return res.blob();
}
