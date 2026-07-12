"use client";

import { useEffect } from "react";

export function ExplorerToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg ring-1 ring-stone-100"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
        !
      </span>
      <p className="text-sm font-medium text-stone-800">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto shrink-0 text-stone-400 hover:text-stone-600"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
