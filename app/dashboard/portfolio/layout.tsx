import { PortfolioMonitoringShell } from "@/components/portfolio-monitoring/PortfolioMonitoringShell";
import { PortfolioProvider } from "@/components/portfolio-monitoring/PortfolioProvider";

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
