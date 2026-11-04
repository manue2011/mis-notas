import {
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardList,
  Code,
  Folder,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  NotebookPen,
  Package,
  Palette,
  Store,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icons a workspace can pick (thin-stroke, never emoji). Stored by key. */
export const WORKSPACE_ICONS = {
  notebook: { label: "Cuaderno", Icon: NotebookPen },
  book: { label: "Libro", Icon: BookOpen },
  folder: { label: "Carpeta", Icon: Folder },
  briefcase: { label: "Maletín", Icon: Briefcase },
  clipboard: { label: "Lista", Icon: ClipboardList },
  users: { label: "Equipo", Icon: Users },
  wrench: { label: "Herramientas", Icon: Wrench },
  lightbulb: { label: "Ideas", Icon: Lightbulb },
  package: { label: "Paquete", Icon: Package },
  truck: { label: "Envíos", Icon: Truck },
  calculator: { label: "Cuentas", Icon: Calculator },
  store: { label: "Tienda", Icon: Store },
  code: { label: "Código", Icon: Code },
  palette: { label: "Diseño", Icon: Palette },
  health: { label: "Salud", Icon: HeartPulse },
  school: { label: "Formación", Icon: GraduationCap },
} satisfies Record<string, { label: string; Icon: LucideIcon }>;

export type WorkspaceIconKey = keyof typeof WORKSPACE_ICONS;

export const WORKSPACE_ICON_KEYS = Object.keys(WORKSPACE_ICONS) as [WorkspaceIconKey, ...WorkspaceIconKey[]];

export function isWorkspaceIcon(value: string | null | undefined): value is WorkspaceIconKey {
  return !!value && value in WORKSPACE_ICONS;
}

export const WORKSPACE_FONTS = {
  serif: { label: "Serifa", sample: "Newsreader, de libro" },
  sans: { label: "Sin serifa", sample: "Instrument Sans, limpia" },
  mono: { label: "Monoespaciada", sample: "Como una máquina de escribir" },
} as const;

export type WorkspaceFontKey = keyof typeof WORKSPACE_FONTS;

export const WORKSPACE_FONT_KEYS = Object.keys(WORKSPACE_FONTS) as [WorkspaceFontKey, ...WorkspaceFontKey[]];
