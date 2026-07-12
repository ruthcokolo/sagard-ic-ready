"use client";

/**
 * Main layout shell for portfolio monitoring: sidebar navigation and page content area.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import {
  portfolioConfigNavStart,
  portfolioNavItems,
} from "@/lib/portfolio-monitoring-navigation";
import { PortfolioNavIcon } from "@/components/portfolio-monitoring/PortfolioNavIcon";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { UserMenu } from "@/components/layout/UserMenu";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

/** Hook to check if the sidebar is hidden and to toggle it open/closed. */
export function usePortfolioSidebar() {
  return useContext(SidebarContext);
}

/** Shortens large badge numbers (e.g. 1500 becomes "1k"). */
function formatBadge(value: number) {
  return value > 999 ? `${Math.floor(value / 1000)}k` : value.toLocaleString();
}

/** One sidebar link with icon, label, and optional notification badge. */
function NavLink({
  item,
  pathname,
  badge,
}: {
  item: (typeof portfolioNavItems)[number];
  pathname: string;
  badge?: number;
}) {
  const active = item.match(pathname);

  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        active
          ? "bg-[#fdf2f4] font-semibold text-[#7a3344]"
          : "font-medium text-stone-600 hover:bg-stone-50"
      }`}
    >
      {active && (
        <span className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-[#7a3344]" />
      )}
      <span className={active ? "text-[#7a3344]" : "text-stone-400"}>
        <PortfolioNavIcon name={item.icon} />
      </span>
      <span className="flex-1 text-[13px]">{item.label}</span>
      {badge != null && badge > 0 && (
        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold tabular-nums text-white">
          {formatBadge(badge)}
        </span>
      )}
    </Link>
  );
}

/** Renders the sidebar and main content area for all portfolio pages. */
export function PortfolioMonitoringShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { needsValidationCount } = usePortfolio();

  const mainNav = portfolioNavItems.slice(0, portfolioConfigNavStart);
  const configNav = portfolioNavItems.slice(portfolioConfigNavStart);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <div className="flex min-h-screen bg-[#f4f2ef]">
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-stone-200/70 bg-white transition-transform duration-300 ease-out ${
            collapsed ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <Link href="/dashboard/portfolio" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7a3344] to-[#5a2533] text-[11px] font-bold tracking-tight text-white shadow-[0_4px_14px_-4px_rgba(107,45,60,0.45)]">
                IC
              </div>
              <div>
                <p className="font-display text-[1.35rem] leading-none text-stone-900">ICReady</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Investment AI
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Hide sidebar"
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              «
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Portfolio
            </p>
            <nav className="space-y-0.5">
              {mainNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  badge={
                    item.badgeKey === "needsValidation" ? needsValidationCount : undefined
                  }
                />
              ))}
            </nav>

            <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Configuration
            </p>
            <nav className="space-y-0.5">
              {configNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div className="border-t border-stone-100 p-4">
            <UserMenu />
          </div>
        </aside>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="fixed left-4 top-5 z-40 flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-soft hover:bg-stone-50"
            aria-label="Show sidebar"
          >
            »
          </button>
        )}

        <main
          className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${
            collapsed ? "ml-0" : "ml-[260px]"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
