import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiPost, apiErrorMessage } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { document?: unknown }).document;
});

describe("API client", () => {
  it("sends cookies and the CSRF token for state-changing requests", async () => {
    (globalThis as { document?: { cookie: string } }).document = { cookie: "csrf_token=test-csrf-token" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );

    await apiPost("/auth/logout");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({ "X-CSRF-Token": "test-csrf-token" }),
      }),
    );
  });

  it("sends credentials on reads and surfaces API errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ user: null }), { status: 200 }),
    );
    await expect(apiGet("/auth/me")).resolves.toEqual({ user: null });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Authentication required." }), { status: 401 }),
    );
    const error = await apiGet("/academics/subjects").catch((value) => value as ApiError);
    expect(apiErrorMessage(error)).toBe("Authentication required.");
  });
});
