import Link from "next/link";
import { IconChevronLeft } from "@/components/ui/Icons";

export function BackNav({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-[#7a3344]"
    >
      <IconChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function resolveBackNav(from: string | null): { href: string; label: string } {
  switch (from) {
    case "ic-readiness":
      return { href: "/ic-readiness", label: "Back to review queue" };
    case "dashboard":
      return { href: "/dashboard", label: "Back to Dashboard" };
    case "onboarding":
      return { href: "/dashboard?welcome=1", label: "Back to Dashboard" };
    case "pipeline":
    default:
      return { href: "/pipeline", label: "Back to Pipeline" };
  }
}
