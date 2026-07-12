/** Home route (`/`): sends visitors straight to the dashboard. */
import { redirect } from "next/navigation";

/** Redirects the root URL to `/dashboard`. */
export default function HomePage() {
  redirect("/dashboard");
}
