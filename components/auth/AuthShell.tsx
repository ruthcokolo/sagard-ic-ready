"use client";

import Link from "next/link";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f2ef]">
      <aside className="relative hidden w-[44%] overflow-hidden bg-gradient-to-br from-[#7a3344] via-[#6b2d3c] to-[#3d1822] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-[0.07] bg-grid" aria-hidden />
        <div className="relative p-10 xl:p-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold text-white backdrop-blur">
            IC
          </div>
          <h1 className="mt-10 font-display text-4xl leading-tight text-white xl:text-[2.75rem]">
            ICReady
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/80">
            Turn scattered deal inputs into IC-ready packages. AI flags conflicts; you own the
            decision.
          </p>
        </div>
        <div className="relative border-t border-white/10 p-10 xl:p-14">
          <p className="text-sm font-medium text-white/90">Built for investment teams</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Cross-source contradiction detection</li>
            <li>Human sign-off before any export</li>
            <li>Sheets, n8n, and Claude in one workflow</li>
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a3344] text-xs font-bold text-white">
              IC
            </div>
          </div>
          <h2 className="font-display text-3xl text-stone-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-stone-400">
            Sagard Investments · Demo environment
          </p>
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#7a3344] focus:ring-2 focus:ring-[#7a3344]/15"
      />
    </label>
  );
}

export function AuthButton({
  children,
  type = "button",
  disabled,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-[#7a3344] text-white hover:bg-[#5a2533]"
      : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50";

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-stone-200" />
      </div>
      <p className="relative mx-auto w-fit bg-[#f4f2ef] px-3 text-xs text-stone-400">{label}</p>
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-6 text-center text-sm text-stone-500">
      {prompt}{" "}
      <Link href={href} className="font-semibold text-[#7a3344] hover:underline">
        {label}
      </Link>
    </p>
  );
}
