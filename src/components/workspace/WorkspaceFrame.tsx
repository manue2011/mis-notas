"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { openPalette } from "@/components/palette/open-palette";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/lib/cx";

type Props = {
  sidebar: ReactNode;
  /** Each page renders its own <TopBar> as part of the content. */
  children: ReactNode;
};

/** Sidebar beside the content on desktop; a drop-down menu on mobile. */
export function WorkspaceFrame({ sidebar, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex items-center justify-between border-b border-border bg-panel px-4 py-2 md:hidden">
        <Logo />
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Buscar"
            aria-haspopup="dialog"
            onClick={openPalette}
            className="grid size-11 place-items-center rounded-md hover:bg-surface/70"
          >
            <Search size={20} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="workspace-sidebar"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-md hover:bg-surface/70"
          >
            {open ? <X size={20} strokeWidth={1.5} aria-hidden /> : <Menu size={20} strokeWidth={1.5} aria-hidden />}
          </button>
        </div>
      </div>

      <aside
        id="workspace-sidebar"
        className={cx(
          "border-border bg-panel md:sticky md:top-0 md:block md:h-screen md:w-[260px] md:shrink-0 md:overflow-y-auto md:border-r",
          open ? "block border-b" : "hidden",
        )}
      >
        {sidebar}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
