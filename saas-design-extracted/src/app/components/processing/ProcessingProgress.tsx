import { memo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

type ProcessingProgressProps = {
  /** Overall progress, 0..1. */
  progress: number;
  remainingMs: number;
};

/**
 * Website port of SnapSell Mobile `ProcessingProgress` — the animated progress
 * bar with percent + remaining-seconds meta. Same 260ms ease-out fill.
 */
const ProcessingProgressComponent = ({
  progress,
  remainingMs,
}: ProcessingProgressProps) => {
  const { t } = useLanguage();
  const percent = Math.round(progress * 100);
  const seconds = Math.ceil(remainingMs / 1000);
  const remainingLabel =
    seconds > 0
      ? t("processing.remaining").replace("{{seconds}}", String(seconds))
      : t("processing.almostDone");

  return (
    <div className="self-stretch flex flex-col gap-2">
      <div className="h-2 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#FF5A5F] transition-[width] duration-[260ms] ease-out"
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{percent}%</span>
        <span className="text-sm text-gray-500" aria-live="polite">
          {remainingLabel}
        </span>
      </div>
    </div>
  );
};

export const ProcessingProgress = memo(ProcessingProgressComponent);
