"use client";

/**
 * Dropdown menu with actions for a company row (view, assign, etc.).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { CompanyDirectoryRow } from "@/lib/portfolio/companies-directory-selectors";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";

type MenuPosition = { top: number; left: number };

/** Dropdown actions menu on a company table row. */
export function CompanyActionsMenu({
  row,
  onAssignOwner,
}: {
  row: CompanyDirectoryRow;
  onAssignOwner: () => void;
}) {
  const router = useRouter();
  const { downloadPackagePdf } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileBase = `/dashboard/portfolio/companies/${row.company.id}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? 224;
      const menuHeight = menu?.offsetHeight ?? 280;
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400";

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[80] w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position ? "visible" : "hidden",
            }}
          >
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                router.push(`${profileBase}?tab=overview`);
              }}
            >
              Open company profile
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                router.push(`${profileBase}?tab=performance`);
              }}
            >
              View metrics
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                router.push(`${profileBase}?tab=reports`);
              }}
            >
              View reporting history
            </button>
            <div className="my-1 border-t border-stone-100" />
            {row.websiteUrl ? (
              <a
                href={row.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className={item}
                onClick={() => setOpen(false)}
              >
                View company website
              </a>
            ) : (
              <button type="button" disabled className={item} title="Website not available">
                Website not available
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={!row.latestPackage}
              onClick={() => {
                if (!row.latestPackage) return;
                setOpen(false);
                downloadPackagePdf(row.latestPackage.id);
              }}
            >
              Open latest report
            </button>
            <div className="my-1 border-t border-stone-100" />
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                onAssignOwner();
              }}
            >
              Assign / reassign owner
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${row.displayName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-stone-700"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {menu}
    </>
  );
}
