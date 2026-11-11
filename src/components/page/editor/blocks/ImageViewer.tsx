"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { Expand, Maximize, Minus, Plus, Shrink, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const STEP = 1.5;

type View = { scale: number; x: number; y: number };
const FIT: View = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The picture being viewed lives outside the blocks: BlockNote remounts a
// block's view when the document changes (a save, someone else typing), and
// a viewer kept in the block's own state would vanish with it.
let viewing: string | null = null;
const listeners = new Set<() => void>();

function setViewing(url: string | null) {
  viewing = url;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Renders the viewer when a picture is open. Mounted once, beside the editor. */
export function ImageViewerHost() {
  const url = useSyncExternalStore(subscribe, () => viewing, () => null);
  return url ? <ImageViewer key={url} url={url} onClose={() => setViewing(null)} /> : null;
}

/**
 * A screenshot on the whole screen: zoom with the wheel, the buttons, the
 * keyboard (+, -, 0) or two fingers, and drag it around once zoomed in.
 */
function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(FIT);
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; view: View } | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    // The wheel zooms here; it mustn't scroll the page behind.
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onFullscreen = () => setFullscreen(document.fullscreenElement === dialog.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      root.style.overflow = overflow;
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, []);

  /** Zooms to `scale`, keeping the point at (px, py) (from the stage's centre) where it is. */
  function zoomTo(scale: number, px = 0, py = 0, from: View = view) {
    const next = clamp(scale, MIN_SCALE, MAX_SCALE);
    if (next === MIN_SCALE) return setView(FIT);
    const ratio = next / from.scale;
    setView({ scale: next, x: px - (px - from.x) * ratio, y: py - (py - from.y) * ratio });
  }

  function fromCentre(clientX: number, clientY: number) {
    const box = stage.current!.getBoundingClientRect();
    return { x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2 };
  }

  function onWheel(event: WheelEvent) {
    const point = fromCentre(event.clientX, event.clientY);
    zoomTo(view.scale * Math.exp(-event.deltaY * 0.0015), point.x, point.y);
  }

  function onPointerDown(event: PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), view };
    }
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent) {
    const last = pointers.current.get(event.pointerId);
    if (!last) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const mid = fromCentre((a.x + b.x) / 2, (a.y + b.y) / 2);
      const { distance, view: start } = pinch.current;
      zoomTo(start.scale * (Math.hypot(a.x - b.x, a.y - b.y) / distance), mid.x, mid.y, start);
    } else if (view.scale > MIN_SCALE) {
      setView((v) => ({ ...v, x: v.x + event.clientX - last.x, y: v.y + event.clientY - last.y }));
    }
  }

  function onPointerUp(event: PointerEvent) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "+" || event.key === "=") zoomTo(view.scale * STEP);
    else if (event.key === "-") zoomTo(view.scale / STEP);
    else if (event.key === "0") setView(FIT);
    else return;
    event.preventDefault();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void dialog.current?.requestFullscreen();
  }

  const percent = Math.round(view.scale * 100);
  const button =
    "inline-flex size-11 items-center justify-center rounded-md text-[#ede5d4] hover:bg-white/10 disabled:opacity-40";

  return createPortal(
    <dialog
      ref={dialog}
      aria-label="Imagen ampliada"
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none bg-[#14110e]/[0.97] p-0 font-sans backdrop:bg-transparent"
    >
      <div
        ref={stage}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const point = fromCentre(e.clientX, e.clientY);
          if (view.scale > MIN_SCALE) setView(FIT);
          else zoomTo(2.5, point.x, point.y);
        }}
        className="absolute inset-0 flex touch-none items-center justify-center overflow-hidden select-none"
        style={{ cursor: view.scale > MIN_SCALE ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimized WebP */}
        <img
          src={url}
          alt=""
          draggable={false}
          // Fills the screen, small pictures too; object-contain keeps its shape.
          className="h-[calc(100dvh-7rem)] w-[calc(100dvw-2rem)] object-contain motion-safe:transition-transform motion-safe:duration-150"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transitionDuration: dragging ? "0ms" : undefined,
          }}
        />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-2">
        <div className="mr-auto flex items-center gap-1 rounded-lg bg-black/40 p-1">
          <button type="button" className={button} onClick={() => zoomTo(view.scale / STEP)} disabled={view.scale <= MIN_SCALE} aria-label="Alejar">
            <Minus size={18} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView(FIT)}
            className="min-h-11 min-w-16 rounded-md px-2 text-sm text-[#ede5d4] tabular-nums hover:bg-white/10"
            aria-label={`Zoom al ${percent} %. Ajustar a la pantalla`}
          >
            {percent} %
          </button>
          <button type="button" className={button} onClick={() => zoomTo(view.scale * STEP)} disabled={view.scale >= MAX_SCALE} aria-label="Acercar">
            <Plus size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {typeof document !== "undefined" && document.fullscreenEnabled ? (
          <button
            type="button"
            className={`${button} bg-black/40`}
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {fullscreen ? <Shrink size={18} strokeWidth={1.75} aria-hidden /> : <Maximize size={18} strokeWidth={1.75} aria-hidden />}
          </button>
        ) : null}
        <button type="button" className={`${button} bg-black/40`} onClick={() => dialog.current?.close()} aria-label="Cerrar" autoFocus>
          <X size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-[#a89c8c]">
        Rueda o dos dedos para acercar · arrastra para moverla · Esc para cerrar
      </p>
    </dialog>,
    document.body,
  );
}

export const openImageViewer = (url: string) => setViewing(url);

/** The corner button that opens the viewer. */
export function ExpandImageButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      // Keeps ProseMirror from turning the press into a block selection.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setViewing(url)}
      aria-label="Ampliar imagen"
      title="Ampliar"
      className="absolute right-3.5 bottom-4 inline-flex size-11 items-center justify-center rounded-md bg-[#2a251f]/70 text-white opacity-0 transition-opacity group-hover/photo:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <Expand size={18} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
