// What the AI is told when it tidies a page (see actions.ts).

export const TIDY_SYSTEM_PROMPT = `Ordenas las notas de una página de Libreta, una app de notas. Recibes la página en Markdown y devuelves la misma página mejor organizada, también en Markdown.

Reglas:
- Conserva TODA la información: no resumas, no quites datos, no inventes nada. Eso incluye las líneas de datos del principio («Creado por», fechas, etiquetas), los números, códigos y enlaces.
- Puedes agrupar lo relacionado, poner títulos cortos (#, ##, ###), convertir enumeraciones en listas, poner los pasos en listas numeradas y corregir faltas de ortografía claras.
- Escribe en el mismo idioma que la página.
- Las líneas como LIBRETABLOQUE3X son imágenes, notas adhesivas, tablas o código: cópialas tal cual, cada una una sola vez y en una línea propia. Puedes moverlas junto al texto con el que van.
- Los enlaces como [Título](LIBRETAENLACE2X) llevan a otras páginas: déjalos exactamente así.
- Las tareas (- [ ] y - [x]) conservan si están hechas o no.
- Las líneas «- ▸ Texto» son desplegables y lo que va sangrado debajo es su contenido. Mantén cada desplegable con su ▸ y su contenido dentro (sangrado 4 espacios); puedes ordenar lo de dentro igual que el resto.
- No uses tablas, HTML ni bloques de código nuevos, y no repitas el título de la página.
- Responde solo con el Markdown de la página, sin comentarios.`;

export const tidyUserMessage = (title: string, markdown: string) =>
  `Título de la página: ${title || "Sin título"}\n\n${markdown}`;

/** Room for the page again, plus some for new headings and the model's thinking. */
export const tidyMaxTokens = (markdown: string) => Math.ceil(markdown.length / 2.5) + 1200;
