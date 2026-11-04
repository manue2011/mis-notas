// Light / dark preference, per person and device. "system" follows the OS.
// Kept in a cookie so the inline script in the root layout can apply it
// before the first paint (no flash of the wrong theme).

export type ThemeChoice = "system" | "light" | "dark";

export const THEME_COOKIE = "libreta-theme";

/** Runs in <head> before anything renders. Keep it tiny and dependency-free. */
export const themeScript = `try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]}catch(e){}`;

export function readThemeChoice(): ThemeChoice {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark)`));
  return (match?.[1] as ThemeChoice | undefined) ?? "system";
}

export function applyThemeChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    delete root.dataset.theme;
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.dataset.theme = choice;
    document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
  }
}
