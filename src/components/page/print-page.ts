/**
 * Opens the browser's print dialog for the open page ("Guardar como PDF").
 * The print styles leave just the note on light paper; here the file gets
 * the page's name.
 */
export function printPage() {
  const previousTitle = document.title;
  // The title as it is now, also when someone else just changed it live.
  document.title = document.querySelector("article h1")?.textContent?.trim() || "Sin título";
  window.addEventListener("afterprint", () => (document.title = previousTitle), { once: true });
  window.print();
}
