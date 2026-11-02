const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Madrid",
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}
