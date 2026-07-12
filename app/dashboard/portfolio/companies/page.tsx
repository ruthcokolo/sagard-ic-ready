/** Route: `/dashboard/portfolio/companies` — searchable list of portfolio companies. */
import { CompaniesView } from "@/components/portfolio-monitoring/CompaniesView";

/** Shows the company directory with filters and add-company actions. */
export default function PortfolioCompaniesPage() {
  return <CompaniesView />;
}
