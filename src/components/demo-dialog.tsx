"use client";

import { useEffect, useRef, useState } from "react";
import { startLoadTimeout } from "@/features/demos/load-timeout";
import { readPlayerEvent } from "@/features/demos/player-event";
import { buildEmbedUrl, EMBED_ORIGIN, shortsPageUrl } from "@/features/demos/video-id";

type LoadStatus = "loading" | "ready" | "failed";

type DemoWindowProps = {
  videoId: string;
  exerciseName: string;
  /** Called once when the user closes the window by any route: button, Escape, or backdrop. */
  onClose: () => void;
};

const LISTENING_MESSAGE = JSON.stringify({ event: "listening" });

/**
 * The in-page demo window (contracts/demo-dialog.md). It is mounted only while open, so the
 * video host is not contacted until the user asks for the demo, and unmounting stops playback.
 * Ready and failed come from the player's own messages, because a frame can load without a video.
 * The browser history entry that makes Back close it is managed by the button, not here.
 */
export function DemoWindow({ videoId, exerciseName, onClose }: DemoWindowProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelTimerRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    closeButtonRef.current?.focus();

    const settle = (next: LoadStatus) => {
      cancelTimerRef.current?.();
      cancelTimerRef.current = null;
      setStatus(next);
    };
    cancelTimerRef.current = startLoadTimeout(() => settle("failed"));

    const onPlayerMessage = (event: MessageEvent) => {
      if (event.origin !== EMBED_ORIGIN) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const readiness = readPlayerEvent(event.data);
      if (readiness) settle(readiness);
    };
    // close fires asynchronously. In development React runs this effect twice, so a close from
    // the first run can arrive after the dialog has reopened; only a dialog that is really closed
    // means the user closed it.
    const onDialogClose = () => {
      if (!dialog.open) onClose();
    };
    window.addEventListener("message", onPlayerMessage);
    dialog.addEventListener("close", onDialogClose);

    return () => {
      window.removeEventListener("message", onPlayerMessage);
      dialog.removeEventListener("close", onDialogClose);
      cancelTimerRef.current?.();
      cancelTimerRef.current = null;
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) dialogRef.current?.close();
  }

  // Asks the player to start sending its ready and error messages to this page.
  function handleFrameLoaded() {
    frameRef.current?.contentWindow?.postMessage(LISTENING_MESSAGE, EMBED_ORIGIN);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="demo-window-title"
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-md rounded-3xl bg-surface-raised p-0 text-foreground ring-1 ring-line backdrop:bg-background/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <h2 id="demo-window-title" className="min-w-0 text-base font-semibold">
            {exerciseName}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-line"
          >
            Close
          </button>
        </header>
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-background">
          {status === "failed" ? (
            <FallbackMessage />
          ) : (
            <>
              <p
                role="status"
                className="absolute inset-0 flex items-center justify-center text-sm text-muted"
              >
                {status === "loading" ? "Loading the demo" : ""}
              </p>
              <iframe
                ref={frameRef}
                title={exerciseName}
                src={buildEmbedUrl(videoId)}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleFrameLoaded}
                className="absolute inset-0 h-full w-full border-0"
              />
            </>
          )}
        </div>
        {/* Always offered: a video the player refuses still leaves the user a way to YouTube. */}
        <a
          href={shortsPageUrl(videoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold underline"
        >
          Open on YouTube
        </a>
      </div>
    </dialog>
  );
}

function FallbackMessage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted">This demo could not load.</p>
    </div>
  );
}
