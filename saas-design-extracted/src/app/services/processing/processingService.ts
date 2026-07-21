/**
 * Simulated generation pipeline — ported 1:1 from SnapSell Mobile
 * (`src/services/processing/processingService.ts`). Pure business logic that
 * owns the ordered steps, their weighted durations, and the math that turns an
 * elapsed time into a view snapshot. Labels are resolved by the UI from i18n.
 */
export type ProcessingStepId =
  | "upload"
  | "analyze"
  | "photo"
  | "title"
  | "description"
  | "keywords"
  | "competitors"
  | "price"
  | "finalize";

export type ProcessingStepDefinition = {
  id: ProcessingStepId;
  durationMs: number;
};

export const PROCESSING_PIPELINE: readonly ProcessingStepDefinition[] = [
  { id: "upload", durationMs: 700 },
  { id: "analyze", durationMs: 1100 },
  { id: "photo", durationMs: 2200 },
  { id: "title", durationMs: 900 },
  { id: "description", durationMs: 1300 },
  { id: "keywords", durationMs: 900 },
  { id: "competitors", durationMs: 1600 },
  { id: "price", durationMs: 1000 },
  { id: "finalize", durationMs: 800 },
];

export type ProcessingSnapshot = {
  /** Index of the step currently running, or `pipeline.length` when finished. */
  activeIndex: number;
  /** Number of fully completed steps. */
  completedCount: number;
  /** Overall progress in the range 0..1. */
  progress: number;
  /** Milliseconds left until completion. */
  remainingMs: number;
  isComplete: boolean;
};

export interface ProcessingService {
  readonly pipeline: readonly ProcessingStepDefinition[];
  readonly totalDurationMs: number;
  snapshotAt(elapsedMs: number): ProcessingSnapshot;
}

export const createProcessingService = (
  pipeline: readonly ProcessingStepDefinition[] = PROCESSING_PIPELINE,
): ProcessingService => {
  const totalDurationMs = pipeline.reduce(
    (total, step) => total + step.durationMs,
    0,
  );

  const snapshotAt = (elapsedMs: number): ProcessingSnapshot => {
    const elapsed = Math.max(0, elapsedMs);
    const isComplete = elapsed >= totalDurationMs;

    if (isComplete) {
      return {
        activeIndex: pipeline.length,
        completedCount: pipeline.length,
        progress: 1,
        remainingMs: 0,
        isComplete: true,
      };
    }

    let boundary = 0;
    let activeIndex = 0;
    for (let index = 0; index < pipeline.length; index += 1) {
      boundary += pipeline[index].durationMs;
      if (elapsed < boundary) {
        activeIndex = index;
        break;
      }
      activeIndex = index + 1;
    }

    const completedCount = activeIndex;
    const progress = elapsed / totalDurationMs;

    return {
      activeIndex,
      completedCount,
      progress,
      remainingMs: totalDurationMs - elapsed,
      isComplete: false,
    };
  };

  return { pipeline, totalDurationMs, snapshotAt };
};

export const processingService = createProcessingService();

/** How long the completed state is held before navigating to the result. */
export const COMPLETION_HOLD_MS = 750;

/** Clock resolution for the simulated pipeline. */
export const TICK_MS = 80;
