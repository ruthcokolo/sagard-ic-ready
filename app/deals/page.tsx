/** Legacy route: `/deals` now points to the dashboard. */
import { redirect } from "next/navigation";

/** Redirects old `/deals` links to `/dashboard`. */
export default function DealsRedirect() {
  redirect("/dashboard");
}
