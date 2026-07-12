export type PipelineStep = {
  id: string;
  label: string;
  durationMs: number;
};

export const NORTHWIND_PIPELINE_STEPS: PipelineStep[] = [
  { id: "sync", label: "Checking 4 sources (Google Sheets via n8n)…", durationMs: 700 },
  { id: "read", label: "Reading investor memo and financial model…", durationMs: 800 },
  { id: "claude", label: "Claude: cross-source comparison…", durationMs: 1000 },
  { id: "conflicts", label: "2 high-severity conflicts detected", durationMs: 500 },
  { id: "draft", label: "Drafting one-pager and checklist…", durationMs: 600 },
  { id: "done", label: "Review updated", durationMs: 350 },
];

export async function runNorthwindPipeline(
  onStep: (index: number, step: PipelineStep) => void,
): Promise<void> {
  for (let i = 0; i < NORTHWIND_PIPELINE_STEPS.length; i++) {
    const step = NORTHWIND_PIPELINE_STEPS[i]!;
    onStep(i, step);
    await new Promise((r) => setTimeout(r, step.durationMs));
  }
}

export function pipelineProgress(index: number): number {
  const total = NORTHWIND_PIPELINE_STEPS.length;
  return Math.round(((index + 1) / total) * 100);
}
