"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UploadBatch, UploadQueueFile } from "@/lib/portfolio/monitoring-phase-types";
import { summarizeUploadBatch } from "@/lib/portfolio/upload-batch";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusDot({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "green" | "amber" | "orange" | "stone" | "red" | "violet";
}) {
  const dot: Record<typeof tone, string> = {
    green: "bg-emerald-500",
    amber: "bg-amber-400",
    orange: "bg-orange-500",
    stone: "bg-stone-400",
    red: "bg-red-500",
    violet: "bg-violet-500",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-600">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} aria-hidden />
      <span className="font-semibold tabular-nums text-stone-800">{count}</span>
      <span>{label}</span>
    </span>
  );
}

export function UploadBatchSummary({ batch }: { batch: UploadBatch }) {
  const s = summarizeUploadBatch(batch);
  if (s.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-stone-200 bg-[#faf9f7] px-4 py-2.5">
      <p className="text-[13px] font-semibold text-stone-900">
        {s.total} file{s.total === 1 ? "" : "s"} selected
      </p>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <StatusDot label="Ready" count={s.ready} tone="green" />
        <StatusDot label="Duplicate" count={s.duplicate} tone="amber" />
        <StatusDot label="Needs input" count={s.needsInput} tone="orange" />
        <StatusDot label="Unsupported" count={s.unsupported} tone="stone" />
        <StatusDot label="Failed" count={s.failed} tone="red" />
        <StatusDot label="Skipped" count={s.skipped} tone="violet" />
      </div>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#c0392b]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7V3.5L18.5 9H15zM8.5 13h1.2c.7 0 1.1.3 1.1.8 0 .4-.3.7-.8.8l1.1 1.7h-.9l-1-.1.6-1.5H9.3V17H8.5v-4zm1.2.6H9.3v1h.4c.3 0 .5-.1.5-.5s-.2-.5-.5-.5zM13 13h1.6c1 0 1.6.6 1.6 1.5S15.6 16 14.6 16H13.8v1H13v-4zm1.5 2.3c.5 0 .8-.3.8-.8s-.3-.8-.8-.8H13.8v1.6h.7zM17.2 13h.9l1.1 4h-.9l-.2-.8h-1.1l-.2.8h-.9l1.3-4zm.5 2.5.3-1.3.3 1.3h-.6z" />
    </svg>
  );
}

function badgeClass(kind: string) {
  switch (kind) {
    case "new":
      return "text-emerald-700";
    case "exact":
      return "bg-sky-50 text-sky-800 ring-sky-100";
    case "revision":
      return "bg-violet-50 text-violet-800 ring-violet-100";
    case "related":
      return "bg-stone-100 text-stone-700 ring-stone-200";
    case "conflict":
      return "bg-amber-50 text-amber-900 ring-amber-100";
    case "ready":
      return "bg-emerald-50 text-emerald-800 ring-emerald-100";
    case "needs":
      return "bg-[#fde8d8] text-[#a85a20] ring-[#f5d0b0]";
    case "processing":
      return "bg-sky-50 text-sky-800 ring-sky-100";
    case "processed":
      return "bg-emerald-50 text-emerald-800 ring-emerald-100";
    case "failed":
      return "bg-red-50 text-red-800 ring-red-100";
    case "skipped":
      return "bg-stone-100 text-stone-600 ring-stone-200";
    case "ocr":
      return "bg-sky-50 text-sky-800 ring-sky-100";
    case "password":
      return "bg-amber-50 text-amber-900 ring-amber-100";
    default:
      return "bg-stone-100 text-stone-600 ring-stone-200";
  }
}

export function UploadFileStatusBadge({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: string;
}) {
  if (kind === "new") {
    return (
      <span className={`text-[12px] font-semibold ${badgeClass(kind)}`}>{children}</span>
    );
  }
  return (
    <span
      className={`inline-flex max-w-[9.5rem] items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-snug ring-1 ring-inset ${badgeClass(kind)}`}
    >
      {children}
    </span>
  );
}

function duplicateBadge(file: UploadQueueFile) {
  if (!file.duplicate || file.duplicate.type === "none") {
    return <UploadFileStatusBadge kind="new">New</UploadFileStatusBadge>;
  }
  if (file.duplicate.type === "exact_duplicate") {
    return <UploadFileStatusBadge kind="exact">Exact duplicate</UploadFileStatusBadge>;
  }
  if (file.duplicate.type === "possible_revision") {
    return <UploadFileStatusBadge kind="revision">Possible revision</UploadFileStatusBadge>;
  }
  if (file.duplicate.type === "same_period_related_document") {
    return <UploadFileStatusBadge kind="related">Related document</UploadFileStatusBadge>;
  }
  if (file.duplicate.type === "metadata_conflict") {
    return <UploadFileStatusBadge kind="conflict">Metadata conflict</UploadFileStatusBadge>;
  }
  return <span className="text-stone-400">—</span>;
}

function readinessBadge(file: UploadQueueFile) {
  const label = file.readinessLabel || file.state;
  if (file.passwordProtected) {
    return <UploadFileStatusBadge kind="password">Password protected</UploadFileStatusBadge>;
  }
  if (file.ocrRequired && file.state === "awaiting_input") {
    return <UploadFileStatusBadge kind="ocr">OCR required</UploadFileStatusBadge>;
  }
  if (file.state === "ready") return <UploadFileStatusBadge kind="ready">Ready</UploadFileStatusBadge>;
  if (file.state === "processing") {
    return (
      <UploadFileStatusBadge kind="processing">
        {file.processingStage ? `Processing · ${file.processingStage}` : "Processing"}
      </UploadFileStatusBadge>
    );
  }
  if (file.state === "processed") {
    return <UploadFileStatusBadge kind="processed">Processed</UploadFileStatusBadge>;
  }
  if (file.state === "failed") return <UploadFileStatusBadge kind="failed">Failed</UploadFileStatusBadge>;
  if (file.state === "skipped") {
    return <UploadFileStatusBadge kind="skipped">Skipped</UploadFileStatusBadge>;
  }
  if (label.toLowerCase().includes("company")) {
    return <UploadFileStatusBadge kind="needs">Needs company confirmation</UploadFileStatusBadge>;
  }
  if (label.toLowerCase().includes("period") || label.toLowerCase().includes("reporting")) {
    return <UploadFileStatusBadge kind="needs">Needs period confirmation</UploadFileStatusBadge>;
  }
  if (label.toLowerCase().includes("metadata") || label.toLowerCase().includes("conflict")) {
    return <UploadFileStatusBadge kind="needs">Needs metadata confirmation</UploadFileStatusBadge>;
  }
  if (label.toLowerCase().includes("waiting") || file.state === "duplicate_found") {
    return <UploadFileStatusBadge kind="needs">Waiting for decision</UploadFileStatusBadge>;
  }
  if (label.toLowerCase().includes("unsupported")) {
    return <UploadFileStatusBadge kind="skipped">Unsupported</UploadFileStatusBadge>;
  }
  return <UploadFileStatusBadge kind="needs">{label}</UploadFileStatusBadge>;
}

export function primaryActionLabel(file: UploadQueueFile): string | null {
  if (file.passwordProtected) return "Remove";
  if (file.state === "processing") return null;
  if (file.state === "ready") return "Process";
  if (file.state === "awaiting_input") return "Confirm";
  if (file.state === "duplicate_found") return "Review";
  if (file.state === "failed") return "Retry";
  if (file.state === "processed") return "View";
  if (file.state === "skipped") return null;
  return file.actionLabel || null;
}

function menuItemsFor(file: UploadQueueFile): [string, string][] {
  const items: [string, string][] = [["preview", "Preview PDF"]];
  if (file.state === "awaiting_input" || file.state === "ready" || file.state === "duplicate_found") {
    items.push(["edit_company", "Edit company"]);
    items.push(["edit_period", "Edit reporting period"]);
    items.push(["edit_format", "Edit format"]);
  }
  if (file.duplicate) {
    items.push(["review_duplicate", "Review duplicate"]);
    if (file.duplicate.type === "exact_duplicate" || file.duplicate.type === "possible_revision") {
      items.push(["process_version", "Process as new version"]);
      items.push(["replace", "Replace existing package"]);
    }
  }
  if (file.state !== "processed" && file.state !== "processing") {
    items.push(["skip", "Skip file"]);
  }
  items.push(["remove", "Remove from queue"]);
  if (file.errorMessage) items.push(["view_error", "View processing error"]);
  return items;
}

function PrimaryActionButton({
  file,
  onPrimary,
}: {
  file: UploadQueueFile;
  onPrimary: () => void;
}) {
  const primary = primaryActionLabel(file);
  if (file.state === "processing") {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 px-2 text-[11px] font-semibold text-sky-700">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
        …
      </span>
    );
  }
  if (!primary) return <span className="text-[12px] text-stone-300">—</span>;
  const isPrimary =
    primary === "Process" ||
    primary === "Confirm" ||
    primary === "Review" ||
    primary === "Retry";
  return (
    <button
      type="button"
      onClick={onPrimary}
      aria-label={`${primary} ${file.fileName}`}
      className={`inline-flex h-[34px] min-w-[72px] items-center justify-center rounded-lg px-2.5 text-[12px] font-semibold ${
        isPrimary
          ? "bg-[#63202e] text-white hover:bg-[#521a26]"
          : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {primary}
    </button>
  );
}

function MoreMenuButton({
  file,
  menuOpen,
  onToggleMenu,
  onMenuAction,
}: {
  file: UploadQueueFile;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: string) => void;
}) {
  const items = menuItemsFor(file);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const update = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      // Hidden mobile/desktop twin buttons report 0×0 — skip those portals.
      if (rect.width < 1 || rect.height < 1) {
        setPosition(null);
        return;
      }
      const menuWidth = 208;
      const menuHeight = Math.min(40 + items.length * 36, 320);
      const gap = 4;
      const padding = 8;
      let left = rect.right - menuWidth;
      left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
      let top = rect.bottom + gap;
      if (top + menuHeight > window.innerHeight - padding && rect.top > menuHeight + gap) {
        top = rect.top - menuHeight - gap;
      }
      top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));
      setPosition({ top, left });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [menuOpen, items.length]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More actions for ${file.fileName}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="8" cy="13" r="1.25" />
        </svg>
      </button>
      {menuOpen && mounted && position
        ? createPortal(
            <div
              role="menu"
              data-upload-row-menu
              className="fixed z-[80] w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
              style={{ top: position.top, left: position.left }}
            >
              {items.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2 text-left text-[12px] text-stone-700 hover:bg-stone-50"
                  onClick={() => onMenuAction(key)}
                >
                  {label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function formatLabel(sourceFormat?: string): {
  label: "Original" | "ICReady Template" | "Scanned" | "Mixed" | null;
  tooltip: string;
} {
  if (!sourceFormat) return { label: null, tooltip: "" };
  const normalized = sourceFormat.toLowerCase();
  if (normalized.includes("scanned")) {
    return { label: "Scanned", tooltip: "Scanned PDF; OCR may be required." };
  }
  if (normalized.includes("mixed")) {
    return { label: "Mixed", tooltip: "Mix of selectable text and scanned content." };
  }
  if (
    normalized.includes("icready") ||
    normalized === "icready_template" ||
    (normalized.includes("template") && !normalized.includes("company"))
  ) {
    return {
      label: "ICReady Template",
      tooltip: "Submitted using ICReady’s standardized reporting template.",
    };
  }
  return {
    label: "Original",
    tooltip: "Submitted using the company’s own layout and terminology.",
  };
}

function FormatCell({ sourceFormat }: { sourceFormat?: string }) {
  const { label, tooltip } = formatLabel(sourceFormat);
  if (!label) return <span className="text-stone-400">—</span>;
  return (
    <span className="cursor-help text-[12px] text-stone-700" title={tooltip}>
      {label}
    </span>
  );
}

export function UploadFileQueueRow({
  file,
  menuOpen,
  onToggleMenu,
  onPrimary,
  onMenuAction,
}: {
  file: UploadQueueFile;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPrimary: () => void;
  onMenuAction: (action: string) => void;
}) {
  const companyConfidence = file.metadata?.companyName.confidence;

  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
      <td className="overflow-hidden px-3 py-2.5 align-middle">
        <div className="flex min-w-0 items-start gap-2">
          <PdfIcon />
          <div className="min-w-0 overflow-hidden">
            <p
              className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-stone-900"
              title={file.fileName}
            >
              {file.fileName}
            </p>
            <p className="text-[11px] text-stone-400">{formatBytes(file.fileSize)}</p>
          </div>
        </div>
      </td>
      <td className="overflow-hidden px-3 py-2.5 align-middle">
        {file.detectedCompanyName ? (
          <div className="min-w-0">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-stone-800">
              {file.detectedCompanyName}
            </p>
            {companyConfidence === "low" ? (
              <p className="text-[10px] text-stone-400">Possible match</p>
            ) : null}
          </div>
        ) : (
          <span className="text-[12px] text-stone-400">No confident match</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[13px] text-stone-700">
        {file.detectedPeriod ?? "—"}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <FormatCell sourceFormat={file.sourceFormat} />
      </td>
      <td className="px-3 py-2.5 align-middle">{duplicateBadge(file)}</td>
      <td className="border-r border-stone-100 px-3 py-2.5 align-middle">
        {readinessBadge(file)}
      </td>
      <td className="bg-white px-2 py-2.5 align-middle">
        <div className="flex justify-center">
          <PrimaryActionButton file={file} onPrimary={onPrimary} />
        </div>
      </td>
      <td className="bg-white px-1 py-2.5 align-middle">
        <div className="flex justify-center">
          <MoreMenuButton
            file={file}
            menuOpen={menuOpen}
            onToggleMenu={onToggleMenu}
            onMenuAction={onMenuAction}
          />
        </div>
      </td>
    </tr>
  );
}

function UploadFileCard({
  file,
  menuOpen,
  onToggleMenu,
  onPrimary,
  onMenuAction,
}: {
  file: UploadQueueFile;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPrimary: () => void;
  onMenuAction: (action: string) => void;
}) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-3.5">
      <div className="flex items-start gap-2">
        <PdfIcon />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-stone-900" title={file.fileName}>
            {file.fileName}
          </p>
          <p className="text-[11px] text-stone-400">{formatBytes(file.fileSize)}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-stone-400">Company</dt>
          <dd className="mt-0.5 text-stone-800">{file.detectedCompanyName ?? "No confident match"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-stone-400">Period</dt>
          <dd className="mt-0.5 text-stone-800">{file.detectedPeriod ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-stone-400">Format</dt>
          <dd className="mt-0.5">
            <FormatCell sourceFormat={file.sourceFormat} />
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-stone-400">Readiness</dt>
          <dd className="mt-1">{readinessBadge(file)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <PrimaryActionButton file={file} onPrimary={onPrimary} />
        <MoreMenuButton
          file={file}
          menuOpen={menuOpen}
          onToggleMenu={onToggleMenu}
          onMenuAction={onMenuAction}
        />
      </div>
    </article>
  );
}

export function UploadFileQueue({
  batch,
  menuFileId,
  onToggleMenu,
  onPrimary,
  onMenuAction,
}: {
  batch: UploadBatch;
  menuFileId: string | null;
  onToggleMenu: (id: string) => void;
  onPrimary: (file: UploadQueueFile) => void;
  onMenuAction: (file: UploadQueueFile, action: string) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (batch.files.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-white px-4 text-center">
        <p className="text-sm font-semibold text-stone-800">Add reporting PDFs</p>
        <p className="mt-1 text-[12px] text-stone-500">
          Upload one or more files, or select a folder.
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        {batch.files.map((file) => (
          <UploadFileCard
            key={file.id}
            file={file}
            menuOpen={menuFileId === file.id}
            onToggleMenu={() => onToggleMenu(file.id)}
            onPrimary={() => onPrimary(file)}
            onMenuAction={(action) => onMenuAction(file, action)}
          />
        ))}
      </div>
    );
  }

  return (
      <div className="relative h-full min-h-0 overflow-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[1120px] table-fixed text-left">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "48px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-stone-100 bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.05em] text-stone-500">
            <tr>
              <th scope="col" className="px-3 py-2.5">
                File
              </th>
              <th scope="col" className="px-3 py-2.5">
                Company
              </th>
              <th scope="col" className="px-3 py-2.5">
                Report period
              </th>
              <th scope="col" className="px-3 py-2.5">
                Format
              </th>
              <th scope="col" className="px-3 py-2.5">
                Duplicate status
              </th>
              <th scope="col" className="border-r border-stone-100 px-3 py-2.5">
                Readiness
              </th>
              <th scope="col" className="bg-[#fafaf9] px-2 py-2.5 text-center">
                Action
              </th>
              <th scope="col" className="bg-[#fafaf9] px-1 py-2.5">
                <span className="sr-only">More actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {batch.files.map((file) => (
              <UploadFileQueueRow
                key={file.id}
                file={file}
                menuOpen={menuFileId === file.id}
                onToggleMenu={() => onToggleMenu(file.id)}
                onPrimary={() => onPrimary(file)}
                onMenuAction={(action) => onMenuAction(file, action)}
              />
            ))}
          </tbody>
        </table>
      </div>
  );
}
