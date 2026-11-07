// Session boundary: auth is an httpOnly cookie the backend owns; the frontend's one
// duty is wiping the react-query cache so one account's data never renders for the next.
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { apiGet, apiPost } from "./api";
import type { SessionUser } from "./types";

export const SESSION_QUERY_KEY = ["session"] as const;

// Who am I? Answers 200 with { user: null } when signed out — no console noise.
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => apiGet<{ user: SessionUser | null }>("/auth/me"),
    staleTime: 60_000,
  });
}

// Call after every successful login/signup.
export function beginSession(): void {
  queryClient.clear();
}

// Call from every sign-out control; the hard redirect resets all in-memory state.
export async function endSession(redirectTo: string = "/login"): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
    window.location.assign(redirectTo);
  }
}
