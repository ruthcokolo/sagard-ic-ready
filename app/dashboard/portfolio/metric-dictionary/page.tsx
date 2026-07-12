/** Legacy route: old metric-dictionary URL now goes to extraction rules. */
import { redirect } from "next/navigation";

/** Redirects `/dashboard/portfolio/metric-dictionary` to extraction rules. */
export default function MetricDictionaryRedirect() {
  redirect("/dashboard/portfolio/extraction-rules");
}
