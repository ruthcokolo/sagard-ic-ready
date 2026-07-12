/** Legacy route: old data-sources URL now goes to reporting packages. */
import { redirect } from "next/navigation";

/** Redirects `/dashboard/portfolio/data-sources` to reporting packages. */
export default function DataSourcesRedirect() {
  redirect("/dashboard/portfolio/reporting-packages");
}
