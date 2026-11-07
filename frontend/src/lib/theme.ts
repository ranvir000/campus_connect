import { useSyncExternalStore } from "react";

// One shared, persisted theme so the header toggle and the Profile toggle never disagree.
const KEY = "cc-theme";
const listeners = new Set<() => void>();

const read = () => localStorage.getItem(KEY) === "dark";

export function applyStoredTheme(): void {
  document.documentElement.classList.toggle("dark", read());
}

export function setDarkTheme(dark: boolean): void {
  localStorage.setItem(KEY, dark ? "dark" : "light");
  applyStoredTheme();
  listeners.forEach((l) => l());
}

export function useDarkTheme(): [boolean, (dark: boolean) => void] {
  const dark = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
  );
  return [dark, setDarkTheme];
}
