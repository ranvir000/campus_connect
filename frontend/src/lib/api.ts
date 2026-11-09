// Set VITE_API_URL to the backend origin in a separate Render Static Site, e.g.
// https://campus-connect-pt36.onrender.com. Local development keeps using Vite's /api proxy.
const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
const BASE = configuredApiUrl
  ? configuredApiUrl.endsWith("/api")
    ? configuredApiUrl
    : `${configuredApiUrl}/api`
  : "/api";

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((entry) => entry.startsWith("csrf_token="))?.split("=").slice(1).join("=");
}

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  const csrf = csrfToken();
  const headers: Record<string, string> = body === undefined ? {} : { "Content-Type": "application/json" };
  if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  // Auth rides the httpOnly session cookie automatically — never add auth headers here.
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // FastAPI reports request-validation failures as 422 with a {detail: [...]} body.
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);

// Human-readable message from an ApiError — FastAPI puts the reason in body.detail
// (a string for HTTPException, an array for 422 validation failures).
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.body && typeof error.body === "object" && "detail" in error.body) {
    const detail = (error.body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    return "Please check the form — some fields are invalid.";
  }
  return "Something went wrong. Please try again.";
}
