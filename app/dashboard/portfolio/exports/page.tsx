/** Route: `/dashboard/portfolio/exports` — download approved portfolio metrics. */
import { ExportsView } from "@/components/portfolio-monitoring/ExportsView";

/** Shows CSV export options and export history for portfolio data. */
export default function PortfolioExportsPage() {
  return <ExportsView />;
}
