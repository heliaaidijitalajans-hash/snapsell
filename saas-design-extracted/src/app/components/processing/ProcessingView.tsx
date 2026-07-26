import { useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProcessing } from "../../hooks/useProcessing";
import {
  PROCESSING_PIPELINE,
  processingService,
} from "../../services/processing/processingService";
import { AiOrb } from "./AiOrb";
import { ProcessingProgress } from "./ProcessingProgress";
import { ProcessingStep, type ProcessingStepStatus } from "./ProcessingStep";

type ProcessingViewProps = {
  runJob: (signal: AbortSignal) => Promise<void>;
  onComplete: () => void;
  onError: (error: unknown) => void;
  onCancel: () => void;
};

const resolveStatus = (
  index: number,
  completedCount: number,
  activeIndex: number,
): ProcessingStepStatus => {
  if (index < completedCount) return "completed";
  if (index === activeIndex) return "active";
  return "pending";
};

/**
 * Website port of SnapSell Mobile `ProcessingScreen` — the full processing
 * experience (AI orb, animated title + current step, progress bar, step list,
 * cancel). Same structure and timing, centered for desktop.
 */
export function ProcessingView({
  runJob,
  onComplete,
  onError,
  onCancel,
}: ProcessingViewProps) {
  const { t } = useLanguage();
  const loadingSectionRef = useRef<HTMLDivElement>(null);
  const { snapshot, canCancel, cancel } = useProcessing({
    runJob,
    onComplete,
    onError,
    onCancel,
  });

  // Scroll as soon as the loading UI is mounted (generation start), not when it finishes.
  useEffect(() => {
    const el = loadingSectionRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const stepLabel = (id: (typeof PROCESSING_PIPELINE)[number]["id"]) =>
    t(`processing.steps.${id}`);

  const currentStepLabel = snapshot.isComplete
    ? t("processing.completed")
    : stepLabel(
        PROCESSING_PIPELINE[
          Math.min(snapshot.activeIndex, PROCESSING_PIPELINE.length - 1)
        ].id,
      );

  return (
    <div
      ref={loadingSectionRef}
      className="max-w-xl mx-auto flex flex-col items-center gap-6 py-6 scroll-mt-24"
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div className="self-stretch flex justify-start min-h-[36px]">
        {canCancel ? (
          <button
            type="button"
            onClick={cancel}
            className="text-base font-semibold text-gray-500 hover:text-gray-700 py-2"
          >
            {t("processing.cancel")}
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-center py-3">
        <AiOrb size={200} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
          {t("processing.title")}
        </h2>
        <div className="h-6 flex items-center justify-center">
          <span
            key={currentStepLabel}
            className="text-base font-semibold text-[#FF5A5F] text-center animate-[fadeIn_280ms_ease]"
            aria-live="polite"
          >
            {currentStepLabel}
          </span>
        </div>
      </div>

      <ProcessingProgress
        progress={snapshot.progress}
        remainingMs={snapshot.remainingMs}
      />

      <div className="self-stretch flex flex-col gap-1 pt-2">
        {processingService.pipeline.map((step, index) => (
          <ProcessingStep
            key={step.id}
            label={stepLabel(step.id)}
            status={resolveStatus(
              index,
              snapshot.completedCount,
              snapshot.activeIndex,
            )}
          />
        ))}
      </div>
    </div>
  );
}
