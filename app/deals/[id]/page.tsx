/** Legacy route: `/deals/[id]` forwards to the company detail page. */
import { redirect } from "next/navigation";

/** Redirects an old deal URL to `/dashboard/companies/[id]`. */
export default async function DealRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/companies/${id}`);
}
