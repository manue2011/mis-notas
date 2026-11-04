// Lets buttons outside the sidebar (the mobile top bar) open the palette.
export const OPEN_PALETTE_EVENT = "libreta:open-palette";

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}
