import { memo } from "react";
import { Check } from "lucide-react";

export type ProcessingStepStatus = "completed" | "active" | "pending";

type ProcessingStepProps = {
  label: string;
  status: ProcessingStepStatus;
};

/**
 * Website port of SnapSell Mobile `ProcessingStep` — a single pipeline step row
 * with completed (green check) / active (pulsing red ring) / pending (hollow
 * dot) indicators. Same status colors and hierarchy.
 */
const ProcessingStepComponent = ({ label, status }: ProcessingStepProps) => {
  return (
    <div className="flex items-center gap-3 min-h-[30px]">
      <div className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
        {status === "completed" ? (
          <span className="w-[22px] h-[22px] rounded-full bg-[#00C853] flex items-center justify-center">
            <Check className="w-[13px] h-[13px] text-white" strokeWidth={3} />
          </span>
        ) : status === "active" ? (
          <span className="w-[22px] h-[22px] rounded-full border-2 border-[#FF5A5F] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#FF5A5F] animate-pulse" />
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full border-[1.5px] border-gray-300" />
        )}
      </div>

      <span
        className={`text-base flex-1 truncate ${
          status === "active"
            ? "text-gray-900 font-bold"
            : status === "completed"
              ? "text-gray-900"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export const ProcessingStep = memo(ProcessingStepComponent);
