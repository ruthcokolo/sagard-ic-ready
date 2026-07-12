/** Route: `/dashboard/portfolio/metric-review` — human review of extracted metrics. */
import { MetricReviewView } from "@/components/portfolio-monitoring/MetricReviewView";

/** Shows the metric review queue and per-package review workspace. */
export default function MetricReviewPage() {
  return <MetricReviewView />;
}
