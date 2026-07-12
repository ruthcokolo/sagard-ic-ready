/** Layout for `/dashboard/portfolio/*`: shared sidebar and portfolio data context. */
import { PortfolioMonitoringShell } from "@/components/portfolio-monitoring/PortfolioMonitoringShell";
import { PortfolioProvider } from "@/components/portfolio-monitoring/PortfolioProvider";

/** Wraps all portfolio pages with state and navigation shell. */
export default function PortfolioMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioProvider>
      <PortfolioMonitoringShell>{children}</PortfolioMonitoringShell>
    </PortfolioProvider>
  );
}
