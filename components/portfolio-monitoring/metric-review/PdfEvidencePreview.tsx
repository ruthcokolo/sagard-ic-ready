"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveSourceDownload, triggerSourceDownload } from "@/lib/portfolio/source-download";
import {
  itemViewportGeometry,
  locateEvidencePhraseOnPage,
  type PhraseLocateResult,
  type PhraseMatchedSpan,
} from "@/lib/portfolio/pdf-evidence-match";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const PRESET_SCALES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5] as const;

type ZoomState = { mode: "fit" } | { mode: "manual"; scale: number };

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: unknown) => { promise: Promise<PdfDocument> };
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type PdfViewport = {
  width: number;
  height: number;
  scale?: number;
  transform: number[];
};

type PdfPage = {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
    canvas: HTMLCanvasElement;
  }) => { promise: Promise<void>; cancel?: () => void };
  getTextContent: () => Promise<{ items: unknown[] }>;
};

type HighlightChip = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  role: "phrase" | "value";
  primary?: boolean;
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    const src = `${window.location.origin}/pdf/pdf.min.mjs`;
    pdfJsPromise = import(/* webpackIgnore: true */ src) as Promise<PdfJsModule>;
  }
  return pdfJsPromise;
}

function collectCandidateUrls(primary: string | null, fallbacks: Array<string | null | undefined>) {
  const urls: string[] = [];
  for (const u of [primary, ...fallbacks]) {
    if (u && !urls.includes(u)) urls.push(u);
  }
  return urls;
}

async function fetchPdfBuffer(urls: string[]): Promise<ArrayBuffer> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} for ${url}`);
        continue;
      }
      return await response.arrayBuffer();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to fetch PDF");
}

function clampScale(scale: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(scale / ZOOM_STEP) * ZOOM_STEP));
}

function nearestPreset(scale: number): number {
  let best: number = PRESET_SCALES[0];
  let bestDist = Math.abs(scale - best);
  for (const s of PRESET_SCALES) {
    const d = Math.abs(scale - s);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

function dropdownValue(zoom: ZoomState, fitScale: number | null) {
  if (zoom.mode === "fit") {
    return fitScale != null ? String(nearestPreset(fitScale)) : "1";
  }
  return String(zoom.scale);
}

function chipsFromPhraseMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textContent: { items: any[] },
  viewport: PdfViewport,
  spans: PhraseMatchedSpan[]
): HighlightChip[] {
  // Prefer value chips over phrase when both cover the same item range.
  const byKey = new Map<string, HighlightChip>();

  for (const span of spans) {
    const item = textContent.items[span.textItemIndex] as
      | { str?: string; transform?: number[]; width?: number }
      | undefined;
    if (!item?.str || !Array.isArray(item.transform) || item.transform.length < 6) continue;

    const geom = itemViewportGeometry(
      item.transform,
      viewport,
      typeof item.width === "number" ? item.width : 0
    );
    const len = Math.max(item.str.length, 1);
    const startRatio = Math.max(0, Math.min(1, span.charStart / len));
    const endRatio = Math.max(startRatio, Math.min(1, span.charEnd / len));
    const left = geom.left + geom.width * startRatio;
    const width = Math.max(geom.width * (endRatio - startRatio), geom.fontHeight * 0.35);

    const key = `${span.textItemIndex}:${span.charStart}:${span.charEnd}:${span.role}`;
    byKey.set(key, {
      key,
      left,
      top: geom.top,
      width,
      height: geom.height,
      role: span.role,
    });
  }

  const chips = [...byKey.values()];
  // Phrase first (under), value on top — sort phrase before value for paint order via z-index in CSS
  chips.sort((a, b) => (a.role === b.role ? 0 : a.role === "phrase" ? -1 : 1));
  if (chips.length > 0) chips[0].primary = true;
  // Mark first value as primary for scroll if present
  const firstValue = chips.find((c) => c.role === "value");
  if (firstValue) {
    chips.forEach((c) => {
      c.primary = false;
    });
    firstValue.primary = true;
  } else if (chips[0]) {
    chips[0].primary = true;
  }
  return chips;
}

const toolbarBtn =
  "inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#7a3344] disabled:cursor-not-allowed disabled:opacity-40";

export function PdfEvidencePreview({
  sourceFile,
  companyId,
  pageNumber,
  fileUrl,
  highlightText,
  evidenceText = "",
  metricName,
  onOpenExternal,
  locateRequest = 0,
  onLocateAvailabilityChange,
}: {
  sourceFile: string;
  companyId: string;
  pageNumber: number;
  fileUrl?: string | null;
  highlightText?: string;
  evidenceText?: string;
  /** @deprecated unused — kept for call-site compatibility */
  highlightKeywords?: string[];
  metricName?: string;
  reportPeriod?: string;
  valueType?: string;
  tableContext?: unknown;
  onOpenExternal?: () => void;
  locateRequest?: number;
  onLocateAvailabilityChange?: (available: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fitScaleRef = useRef<number | null>(null);
  const renderTaskRef = useRef<{ cancel?: () => void } | null>(null);
  const textContentRef = useRef<{ items: unknown[] } | null>(null);
  const viewportRef = useRef<PdfViewport | null>(null);
  const pdfDocRef = useRef<PdfDocument | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unavailable">("loading");
  const [zoom, setZoom] = useState<ZoomState>({ mode: "fit" });
  const [fitScale, setFitScale] = useState<number | null>(null);
  const [panelWidth, setPanelWidth] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activePage, setActivePage] = useState(Math.max(1, pageNumber || 1));
  const [retryKey, setRetryKey] = useState(0);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [locateResult, setLocateResult] = useState<PhraseLocateResult | null>(null);
  const [chips, setChips] = useState<HighlightChip[]>([]);
  const [pageCssSize, setPageCssSize] = useState({ width: 0, height: 0 });
  const [pulse, setPulse] = useState(false);
  const [evidenceScanDone, setEvidenceScanDone] = useState(false);

  const catalogResolved = useMemo(
    () => resolveSourceDownload({ sourceFile, companyId }),
    [sourceFile, companyId]
  );
  const resolved = useMemo(
    () => resolveSourceDownload({ sourceFile, companyId, fileUrl }),
    [sourceFile, companyId, fileUrl]
  );

  const page = Math.max(1, activePage || pageNumber || 1);
  const downloadUrl = resolved.url ?? catalogResolved.url;
  const currentScale = zoom.mode === "fit" ? fitScale ?? 1 : zoom.scale;

  useEffect(() => {
    setActivePage(Math.max(1, pageNumber || 1));
    setEvidenceScanDone(false);
  }, [pageNumber, evidenceText, highlightText, sourceFile, fileUrl]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    let last = node.clientWidth;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (Math.abs(w - last) < 8) return;
      last = w;
      setPanelWidth(w);
    });
    ro.observe(node);
    setPanelWidth(node.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (panelWidth <= 0) return;
    fitScaleRef.current = null;
    if (zoom.mode === "fit") setRetryKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelWidth]);

  const bumpZoom = useCallback(
    (delta: number) => {
      setZoom((prev) => {
        const base = prev.mode === "fit" ? fitScaleRef.current ?? currentScale : prev.scale;
        return { mode: "manual", scale: clampScale(base + delta) };
      });
    },
    [currentScale]
  );

  const handleReset = useCallback(() => {
    fitScaleRef.current = null;
    setZoom({ mode: "fit" });
    setRetryKey((k) => k + 1);
  }, []);

  const scrollToEvidence = useCallback(() => {
    const node = scrollRef.current?.querySelector('[data-evidence-highlight="primary"]');
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    setPulse(true);
    window.setTimeout(() => setPulse(false), 900);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const urls = collectCandidateUrls(
        // Prefer the package's own URL / exact filename resolution first.
        // Never let a company-level catalog fallback override the correct report PDF.
        resolved.url && !resolved.url.startsWith("blob:") ? resolved.url : null,
        [
          fileUrl && !fileUrl.startsWith("blob:") ? fileUrl : null,
          catalogResolved.url &&
          catalogResolved.url !== resolved.url &&
          !catalogResolved.url.startsWith("blob:")
            ? catalogResolved.url
            : null,
          fileUrl?.startsWith("blob:") ? fileUrl : null,
          resolved.url?.startsWith("blob:") ? resolved.url : null,
        ]
      );

      if (urls.length === 0) {
        setStatus("unavailable");
        setLocateResult(null);
        setChips([]);
        onLocateAvailabilityChange?.(false);
        return;
      }

      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        setStatus("error");
        setErrorDetail("Preview canvas not ready");
        return;
      }

      try {
        setStatus("loading");
        setErrorDetail(null);

        const pdfjs = await loadPdfJs();
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";

        const buffer = await fetchPdfBuffer(urls);
        if (cancelled) return;

        const pdf = await pdfjs
          .getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
            isEvalSupported: false,
          })
          .promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);

        const query = {
          evidenceText,
          extractedValue: highlightText,
          metricName,
        };

        // Always verify evidence against the PDF. Prefer the metric's source page,
        // then scan every page until the phrase/value+label can be highlighted.
        let targetPage = Math.min(Math.max(1, page), pdf.numPages);
        let locate: PhraseLocateResult = {
          status: "unavailable",
          spans: [],
          message: "Exact evidence phrase could not be located in this PDF.",
        };

        if (evidenceText.trim() || highlightText?.trim()) {
          const preferred = Math.min(Math.max(1, pageNumber || page), pdf.numPages);
          const order = [
            preferred,
            ...Array.from({ length: pdf.numPages }, (_, i) => i + 1).filter((p) => p !== preferred),
          ];
          for (const candidate of order) {
            const probe = await pdf.getPage(candidate);
            const textContent = await probe.getTextContent();
            const result = locateEvidencePhraseOnPage(textContent, query);
            if (result.status === "located") {
              targetPage = candidate;
              locate = result;
              break;
            }
          }
          if (!cancelled && targetPage !== page) {
            setActivePage(targetPage);
            // Re-render will pick up activePage; avoid double work this pass by continuing
            // with targetPage below.
          }
        }
        setEvidenceScanDone(true);

        const pdfPage = await pdf.getPage(targetPage);
        const baseViewport = pdfPage.getViewport({ scale: 1 });

        const containerWidth = Math.max(
          (scrollRef.current?.clientWidth ?? panelWidth ?? 360) - 24,
          180
        );
        const nextFit = containerWidth / baseViewport.width;
        fitScaleRef.current = nextFit;
        setFitScale(nextFit);

        const logicalScale = zoom.mode === "fit" ? nextFit : clampScale(zoom.scale);
        const outputScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const displayViewport = pdfPage.getViewport({ scale: logicalScale });
        const renderViewport = pdfPage.getViewport({ scale: logicalScale * outputScale });

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setStatus("error");
          setErrorDetail("Canvas context unavailable");
          return;
        }

        try {
          renderTaskRef.current?.cancel?.();
        } catch {
          /* ignore */
        }

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${displayViewport.width}px`;
        canvas.style.height = `${displayViewport.height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        const task = pdfPage.render({
          canvasContext: ctx,
          viewport: renderViewport,
          canvas,
        });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;

        setPageCssSize({ width: displayViewport.width, height: displayViewport.height });

        const textContent = await pdfPage.getTextContent();
        textContentRef.current = textContent;
        viewportRef.current = displayViewport;

        // Re-locate on the rendered page so chip geometry matches this viewport.
        if (evidenceText.trim() || highlightText?.trim()) {
          locate = locateEvidencePhraseOnPage(textContent, query);
        }

        const nextChips =
          locate.status === "located"
            ? chipsFromPhraseMatch(textContent, displayViewport, locate.spans)
            : [];

        if (!cancelled) {
          setLocateResult(locate);
          setChips(nextChips);
          setStatus("ready");
          onLocateAvailabilityChange?.(locate.status === "located");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setLocateResult(null);
          setChips([]);
          setErrorDetail(err instanceof Error ? err.message : "Preview failed");
          onLocateAvailabilityChange?.(false);
        }
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        /* ignore */
      }
    };
  }, [
    resolved.url,
    catalogResolved.url,
    fileUrl,
    page,
    pageNumber,
    zoom,
    highlightText,
    evidenceText,
    metricName,
    retryKey,
    panelWidth,
    onLocateAvailabilityChange,
  ]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!locateResult || locateResult.status !== "located") return;
    const t = window.setTimeout(() => scrollToEvidence(), 80);
    return () => window.clearTimeout(t);
  }, [status, locateResult, zoom, locateRequest, scrollToEvidence]);

  useEffect(() => {
    if (locateRequest > 0) scrollToEvidence();
  }, [locateRequest, scrollToEvidence]);

  const effectiveScale = zoom.mode === "fit" ? fitScale ?? 1 : zoom.scale;
  const atMin = effectiveScale <= MIN_ZOOM + 1e-9;
  const atMax = effectiveScale >= MAX_ZOOM - 1e-9;

  // Prefer bottom-left; move to top-left if evidence chips occupy the bottom-left corner.
  const pageOverlayAtTop = useMemo(() => {
    if (chips.length === 0 || pageCssSize.height <= 0) return false;
    const zoneBottom = pageCssSize.height - 56;
    const zoneRight = 140;
    return chips.some((c) => c.left < zoneRight && c.top + c.height > zoneBottom);
  }, [chips, pageCssSize.height]);

  if (status === "unavailable") {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-stone-700">Source file unavailable</p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="mt-3 rounded-lg bg-[#7a3344] px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          Retry preview
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
      {/* Toolbar: [Reset] … [−] [%] [+] [Download] */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-3 py-2">
        <button
          type="button"
          onClick={handleReset}
          className={`${toolbarBtn} px-3`}
          title="Reset zoom and return to evidence"
          aria-label="Reset zoom and return to evidence"
        >
          Reset
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => bumpZoom(-ZOOM_STEP)}
            disabled={atMin}
            className={`${toolbarBtn} w-9`}
            aria-label="Zoom out"
          >
            −
          </button>
          <select
            value={dropdownValue(zoom, fitScale)}
            onChange={(e) => setZoom({ mode: "manual", scale: clampScale(Number(e.target.value)) })}
            className={`${toolbarBtn} min-w-[5.5rem] px-2`}
            aria-label="PDF zoom level"
          >
            {PRESET_SCALES.map((s) => (
              <option key={s} value={String(s)}>
                {Math.round(s * 100)}%
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => bumpZoom(ZOOM_STEP)}
            disabled={atMax}
            className={`${toolbarBtn} w-9`}
            aria-label="Zoom in"
          >
            +
          </button>
          {downloadUrl ? (
            <button
              type="button"
              onClick={() => void triggerSourceDownload(downloadUrl, resolved.fileName)}
              className={`${toolbarBtn} px-3`}
              aria-label="Download source PDF"
            >
              Download
            </button>
          ) : null}
        </div>
      </div>

      {status === "error" ? (
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-stone-700">PDF preview unavailable</p>
          {errorDetail ? <p className="mt-1 text-[11px] text-stone-500">{errorDetail}</p> : null}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {onOpenExternal ? (
              <button type="button" onClick={onOpenExternal} className={`${toolbarBtn} px-3`}>
                Open PDF
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="rounded-lg bg-[#7a3344] px-3 py-2 text-[11px] font-semibold text-white"
            >
              Retry preview
            </button>
          </div>
        </div>
      ) : null}

      {status === "ready" && evidenceScanDone && locateResult?.status === "unavailable" ? (
        <div className="border-b border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
          Extracted evidence could not be verified in this PDF. Re-process the package or edit the
          value — do not approve until evidence is visible on the page.
        </div>
      ) : null}

      {status === "ready" && locateResult?.status === "located" ? (
        <div className="border-b border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[11px] text-emerald-900">
          Evidence highlighted on page {page}
          {totalPages > 1 ? ` of ${totalPages}` : ""}.
        </div>
      ) : null}

      <div
        className={`relative max-h-[440px] ${status === "error" ? "hidden" : ""}`}
      >
        <div
          ref={scrollRef}
          className="max-h-[440px] overflow-auto bg-stone-200/60 p-3"
        >
          <div
            className="pdf-page-container relative mx-auto shadow-md"
            style={{
              width: pageCssSize.width || undefined,
              height: pageCssSize.height || undefined,
            }}
          >
            {status === "loading" ? (
              <div className="absolute inset-0 z-30 flex min-h-48 items-center justify-center bg-stone-100/85 text-[12px] text-stone-500">
                Loading source page and locating evidence…
              </div>
            ) : null}

            <canvas
              ref={canvasRef}
              className={`block bg-white ${status === "ready" ? "opacity-100" : "opacity-40"}`}
            />

            {/* Exact phrase chips only — no paragraph bounding boxes */}
            <div className="pointer-events-none absolute inset-0">
              {chips.map((chip) => (
                <div
                  key={chip.key}
                  data-evidence-highlight={chip.primary ? "primary" : undefined}
                  className={
                    chip.role === "value"
                      ? `pdf-evidence-value absolute z-[2] rounded-[2px] bg-[rgba(250,204,21,0.32)] shadow-[0_0_0_1px_rgba(217,119,6,0.45)] ${
                          pulse ? "animate-pulse" : ""
                        }`
                      : `pdf-evidence-phrase absolute z-[1] rounded-[2px] bg-[rgba(253,224,71,0.22)] ${
                          pulse && chip.primary ? "animate-pulse" : ""
                        }`
                  }
                  style={{
                    left: chip.left,
                    top: chip.top,
                    width: chip.width,
                    height: Math.max(chip.height, 8),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Page indicator: fixed in viewport, not in toolbar */}
        {status === "ready" || status === "loading" ? (
          <div
            className={`pointer-events-none absolute z-20 rounded-md border border-stone-200/70 bg-[#faf9f7]/92 px-2 py-1 text-[11px] tabular-nums text-stone-500 shadow-sm backdrop-blur-[1px] ${
              pageOverlayAtTop ? "left-2.5 top-2.5" : "bottom-2.5 left-2.5"
            }`}
            aria-live="polite"
          >
            Page {page}
            {totalPages > 0 ? ` of ${totalPages}` : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}
