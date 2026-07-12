"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/deals", disabled: true },
  { label: "Deals", href: "/deals" },
  { label: "IC Readiness", href: "/deals/northwind-logistics", matchPrefix: "/deals/" },
  { label: "Exports", href: "/deals", disabled: true },
  { label: "Settings", href: "/deals", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, matchPrefix?: string) => {
    if (matchPrefix) {
      return pathname.startsWith(matchPrefix) && pathname !== "/deals";
    }
    return pathname === href;
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/deals" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sagard-700 text-xs font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">ICReady AI</p>
            <p className="text-[10px] uppercase tracking-wider text-stone-400">by Sagard</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = !item.disabled && isActive(item.href, item.matchPrefix);
          const className = `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
            active
              ? "bg-sagard-50 font-medium text-sagard-800"
              : item.disabled
                ? "cursor-default text-stone-300"
                : "text-stone-600 hover:bg-stone-50"
          }`;

          if (item.disabled) {
            return (
              <span key={item.label} className={className}>
                {item.label}
              </span>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {item.label}
              {item.label === "Deals" && pathname === "/deals" && (
                <span className="text-stone-400">›</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sagard-100 text-sm font-semibold text-sagard-700">
            AR
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900">Alex Rivera</p>
            <p className="text-xs text-stone-500">Associate</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
