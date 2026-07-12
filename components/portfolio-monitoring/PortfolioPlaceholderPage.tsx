import Link from "next/link";

export function PortfolioPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
        Portfolio Monitoring
      </p>
      <h2 className="font-display mt-2 text-2xl text-stone-900">{title}</h2>
      <p className="mt-3 max-w-md text-sm text-stone-500">{description}</p>
      <Link
        href="/dashboard/portfolio"
        className="mt-6 rounded-xl bg-[#7a3344] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a2533]"
      >
        Back to Portfolio Overview
      </Link>
    </div>
  );
}
