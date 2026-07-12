/** Route: `/portfolio-metrics` — legacy redirect to portfolio monitoring. */
import { redirect } from "next/navigation";

/** Redirects deprecated portfolio metrics URL to `/dashboard/portfolio`. */
export default function LegacyPortfolioMetricsPage() {
  redirect("/dashboard/portfolio");
}
