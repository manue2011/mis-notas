"use client";

import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import {
  Braces,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Quote,
  SquareCheck,
  StickyNote,
  Type,
} from "lucide-react";
import type { PageBlock, PageEditor } from "./schema";

const icon = (Icon: typeof Type) => <Icon size={18} strokeWidth={1.5} aria-hidden />;

/** The "/" menu: the five notebook blocks first, then the rest. */
export function slashMenuItems(editor: PageEditor): DefaultReactSuggestionItem[] {
  const insert = (block: PageBlock) => () => insertOrUpdateBlockForSlashMenu(editor, block);
  const main = "Bloques";
  const more = "Más";

  return [
    { title: "Texto", subtext: "Escribe sin más", aliases: ["parrafo", "p"], group: main, icon: icon(Type), onItemClick: insert({ type: "paragraph" }) },
    { title: "Lista de tareas", subtext: "Para marcar lo hecho", aliases: ["tareas", "todo", "check"], group: main, icon: icon(SquareCheck), onItemClick: insert({ type: "checkListItem" }) },
    { title: "Pantallazo", subtext: "O pega con Ctrl+V", aliases: ["imagen", "foto", "captura"], group: main, icon: icon(Image), onItemClick: insert({ type: "screenshot" }) },
    { title: "Nota adhesiva", subtext: "Un recordatorio a mano", aliases: ["nota", "post-it"], group: main, icon: icon(StickyNote), onItemClick: insert({ type: "stickyNote" }) },
    { title: "Código", subtext: "Con colores por lenguaje", aliases: ["code", "codigo"], group: main, icon: icon(Braces), onItemClick: insert({ type: "codeBlock" }) },
    { title: "Título", subtext: "Encabezado grande", aliases: ["h1"], group: more, icon: icon(Heading1), onItemClick: insert({ type: "heading", props: { level: 1 } }) },
    { title: "Subtítulo", subtext: "Encabezado de sección", aliases: ["h2"], group: more, icon: icon(Heading2), onItemClick: insert({ type: "heading", props: { level: 2 } }) },
    { title: "Apartado", subtext: "Encabezado pequeño", aliases: ["h3"], group: more, icon: icon(Heading3), onItemClick: insert({ type: "heading", props: { level: 3 } }) },
    { title: "Lista", subtext: "Con viñetas", aliases: ["ul", "vinetas"], group: more, icon: icon(List), onItemClick: insert({ type: "bulletListItem" }) },
    { title: "Lista numerada", subtext: "Paso a paso", aliases: ["ol", "numeros"], group: more, icon: icon(ListOrdered), onItemClick: insert({ type: "numberedListItem" }) },
    { title: "Cita", subtext: "Palabras de otro", aliases: ["quote"], group: more, icon: icon(Quote), onItemClick: insert({ type: "quote" }) },
  ];
}
