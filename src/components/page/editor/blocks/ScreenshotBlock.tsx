"use client";

import { useRef } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { ImagePlus } from "lucide-react";
import { Tape } from "@/components/ui/Tape";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/assets/upload-client";
import { screenshotConfig } from "../block-configs";
import { usePageEditor } from "../editor-context";
import { useUploadState } from "../upload-store";

/** A screenshot taped onto the page, with a handwritten caption (the block's text). */
export const screenshotBlock = createReactBlockSpec(
  screenshotConfig,
  {
    render: ({ block, contentRef }) => (
      <figure className="screenshot-block my-6 flex w-full flex-col items-center">
        <div
          contentEditable={false}
          className="light-island relative max-w-full bg-photo p-2.5 pb-3 shadow-paper"
          style={{ rotate: "-0.8deg" }}
        >
          <Tape className="-top-2 left-6 w-24" rotate={-4} />
          <Tape className="-top-2 right-6 w-24" rotate={3} />
          {block.props.url ? (
            <ScreenshotImage url={block.props.url} width={block.props.width} height={block.props.height} />
          ) : (
            <EmptyScreenshot blockId={block.id} />
          )}
        </div>
        <figcaption
          ref={contentRef}
          // relative: BlockNote positions the placeholder against it.
          className="screenshot-caption relative mt-3 min-w-40 text-center font-hand text-xl leading-tight text-ink-muted"
        />
      </figure>
    ),
  },
)();

/**
 * Only this workspace's own uploads are shown: with real-time editing a url
 * reaches others before the server's checks run, so it's checked here too.
 */
function ScreenshotImage({ url, width, height }: { url: string; width: number; height: number }) {
  const { ownImagePattern } = usePageEditor();
  if (!ownImagePattern?.test(url)) {
    return (
      <div className="flex h-32 w-[28rem] max-w-full items-center justify-center bg-[#f3f1ec] px-8 text-center font-sans text-sm text-ink-muted">
        Esta imagen no se subió a este espacio, así que no se muestra.
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimized WebP
    <img
      src={url}
      alt=""
      width={width || undefined}
      height={height || undefined}
      loading="lazy"
      className="block h-auto max-h-[36rem] w-auto max-w-full"
    />
  );
}

function EmptyScreenshot({ blockId }: { blockId: string }) {
  const { editable, uploadInto } = usePageEditor();
  const upload = useUploadState(blockId);
  const input = useRef<HTMLInputElement>(null);

  if (upload && !upload.error) {
    const percent = Math.round(upload.progress * 100);
    return (
      <div className="flex h-48 w-[28rem] max-w-full flex-col items-center justify-center gap-3 bg-[#f3f1ec] px-8">
        <p className="font-sans text-sm text-ink-muted">
          {percent < 100 ? `Subiendo… ${percent} %` : "Revelando la foto…"}
        </p>
        <div
          role="progressbar"
          aria-label="Subida del pantallazo"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-rule"
        >
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-48 w-[28rem] max-w-full flex-col items-center justify-center gap-3 border-[1.5px] border-dashed border-accent/50 bg-[#f3f1ec] px-8 text-center font-sans">
      {upload?.error ? <p className="text-sm text-error">{upload.error}</p> : null}
      {editable ? (
        <>
          <p className="text-sm text-ink-muted">Pega un pantallazo con Ctrl+V o</p>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-panel"
          >
            <ImagePlus size={16} strokeWidth={1.5} aria-hidden />
            Elegir una imagen
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) uploadInto(blockId, file);
              e.currentTarget.value = "";
            }}
          />
        </>
      ) : (
        <p className="text-sm text-ink-muted">Aquí iba un pantallazo que nunca llegó.</p>
      )}
    </div>
  );
}
