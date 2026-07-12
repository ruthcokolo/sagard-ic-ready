export function BlockerAcknowledgeModal({
  open,
  blockerCount,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  blockerCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
          Confirm your choice
        </p>
        <h3 className="mt-2 text-lg font-semibold text-stone-900">Recommend with open issues?</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          This deal still has {blockerCount} open issue{blockerCount > 1 ? "s" : ""}. Your explanation
          will be saved with the download and activity log.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
          >
            Recommend anyway
          </button>
        </div>
      </div>
    </div>
  );
}
