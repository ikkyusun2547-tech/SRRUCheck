import { API_BASE_URL } from "./config";
import { getToken } from "./auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

// Thin wrapper around the same Next.js API routes the web client calls —
// see AGENTS.md: no business logic is duplicated in this app. The only
// mobile-specific piece is attaching the Bearer token in place of the
// session cookie the browser would otherwise send.
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response (e.g. a redirect HTML page) — treated as an error below.
  }

  if (!res.ok) {
    const body = json as { error?: string; code?: string } | null;
    throw new ApiError(body?.error ?? `คำขอล้มเหลว (${res.status})`, res.status, body?.code);
  }

  return json as T;
}
