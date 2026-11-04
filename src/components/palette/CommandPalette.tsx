"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FormAlert } from "@/components/auth/FormAlert";
import type { AccentKey } from "@/lib/accent";
import { createPageAction } from "@/lib/pages/actions";
import type { FlatPage } from "@/lib/pages/tree";
import { buildPaletteItems, type PaletteItem } from "./palette-items";
import { optionId, PaletteList } from "./PaletteList";
import { PaletteTrigger } from "./PaletteTrigger";
import { useRemoteSearch } from "./useRemoteSearch";

type Props = {
  organizationId: string;
  slug: string;
  pages: FlatPage[];
  workspaces: { id: string; slug: string; name: string; accent: AccentKey }[];
  canCreate: boolean;
};

/** Ctrl/Cmd + K: jump to a page, search, create a page or switch workspace. */
export function CommandPalette(props: Props) {
  const { organizationId, slug, pages, workspaces, canCreate } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const listId = useId();
  // The dialog is portalled out of the sidebar (hidden on mobile) into the
  // workspace's accent scope, so it keeps the accent colours.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  const findHost = () => setHost(anchorRef.current?.closest(".accent-scope") ?? document.body);

  const { hits, loading } = useRemoteSearch(organizationId, open ? query : "");
  const items = useMemo(
    () => buildPaletteItems({ query, slug, pages, workspaces, canCreate, remoteHits: hits }),
    [query, slug, pages, workspaces, canCreate, hits],
  );
  const active = Math.min(activeIndex, items.length - 1);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        // Capture phase, so the editor's own Ctrl+K never sees it.
        e.preventDefault();
        e.stopPropagation();
        findHost();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, host]);

  function reset() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setError(null);
  }

  function pick(item: PaletteItem) {
    if (item.action.kind === "go") {
      reset();
      router.push(item.action.href);
      return;
    }
    setError(null);
    startTransition(async () => {
      // Redirects to the new page on success.
      const result = await createPageAction(organizationId);
      if (result?.error) setError(result.error);
      else reset();
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + items.length) % items.length);
    } else if (e.key === "Enter" && items[active] && !pending) {
      e.preventDefault();
      pick(items[active]);
    }
  }

  useEffect(() => {
    if (open) document.getElementById(optionId(listId, active))?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  return (
    <>
      <span ref={anchorRef} hidden />
      <PaletteTrigger
        onOpen={() => {
          findHost();
          setOpen(true);
        }}
      />
      {!host
        ? null
        : createPortal(
            <dialog
              ref={dialogRef}
              aria-label="Paleta de comandos"
              onClose={reset}
              onClick={(e) => e.target === e.currentTarget && reset()}
              className="mx-auto mt-[12vh] mb-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-ink shadow-paper transition-[opacity,translate] duration-150 backdrop:bg-ink/25 starting:open:-translate-y-1 starting:open:opacity-0"
            >
              {open ? (
                <div className="flex max-h-[70vh] flex-col">
                  <label className="flex items-center gap-3 border-b border-dashed border-border px-4">
                    <Search size={18} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
                    <span className="sr-only">Buscar páginas o acciones</span>
                    <input
                      autoFocus
                      role="combobox"
                      aria-expanded
                      aria-controls={listId}
                      aria-activedescendant={items.length ? optionId(listId, active) : undefined}
                      aria-autocomplete="list"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                      }}
                      onKeyDown={onKeyDown}
                      maxLength={200}
                      placeholder="Busca una página o escribe qué quieres hacer…"
                      // The open dialog already shows where focus is; no second ring.
                      className="min-h-14 w-full bg-transparent font-serif text-lg outline-none placeholder:text-ink-muted/70 focus-visible:outline-none!"
                    />
                  </label>
                  <div className="overflow-y-auto p-1.5">
                    {items.length ? (
                      <PaletteList
                        id={listId}
                        items={items}
                        activeIndex={active}
                        onHover={setActiveIndex}
                        onPick={(item) => !pending && pick(item)}
                      />
                    ) : (
                      <p className="px-3 py-6 font-hand text-xl text-ink-muted">
                        {loading ? "buscando entre las hojas…" : "aquí no hay nada todavía"}
                      </p>
                    )}
                    <FormAlert message={error} />
                  </div>
                  <p className="flex gap-4 border-t border-dashed border-border px-4 py-2 text-xs text-ink-muted">
                    <span>↑↓ moverse</span>
                    <span>Intro abrir</span>
                    <span>Esc cerrar</span>
                    {loading ? <span className="ml-auto">Buscando…</span> : null}
                    {pending ? <span className="ml-auto">Creando página…</span> : null}
                  </p>
                </div>
              ) : null}
            </dialog>,
            host,
          )}
    </>
  );
}
