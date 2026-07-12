"use client";

/** Main app layout: sidebar, header bar, and scrollable page content. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { navItems } from "@/lib/navigation";
import { NavIcon } from "@/components/ui/Icons";
import { UserMenu } from "@/components/layout/UserMenu";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

/** Hook to read app sidebar state. */
export function useAppSidebar() {
  return useContext(SidebarContext);
}

/** Page layout with sidebar navigation and header. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <div className="flex min-h-screen bg-[#f4f2ef]">
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-stone-200/70 bg-white transition-transform duration-300 ease-out ${
            collapsed ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
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

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const active = item.match(pathname);
              const badge = "badge" in item ? item.badge : undefined;
              return (
                <Link
                  key={item.href}
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
                    <NavIcon name={item.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[13px]">{item.label}</span>
                    <span
                      className={`block truncate text-[10px] font-normal ${
                        active ? "text-[#7a3344]/70" : "text-stone-400"
                      }`}
                    >
                      {item.hint}
                    </span>
                  </div>
                  {badge != null && (
                    <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#e8dcc8] px-1.5 text-[11px] font-bold tabular-nums text-[#6b5344]">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

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

        <div
          className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ${
            collapsed ? "ml-0" : "ml-[260px]"
          }`}
        >
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
