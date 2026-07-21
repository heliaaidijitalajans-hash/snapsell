import { memo } from "react";
import type { StatTone } from "../../services/price/priceTypes";

type StatCardProps = {
  label: string;
  value: string;
  tone: StatTone;
};

/**
 * Website port of SnapSell Mobile `StatCard` — a single elegant statistic tile
 * from the competitor analysis. Same structure (tone dot + uppercase label +
 * value), adapted to the website's light surface.
 */
const TONE_COLOR: Record<StatTone, string> = {
  positive: "#00C853",
  neutral: "#6B7280",
  caution: "#FFC107",
  critical: "#FF5252",
};

const StatCardComponent = ({ label, value, tone }: StatCardProps) => {
  return (
    <div className="flex-grow basis-[47%] rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: TONE_COLOR[tone] }}
          aria-hidden
        />
        <span className="text-xs text-gray-500 tracking-wide uppercase">
          {label}
        </span>
      </div>
      <span className="text-lg font-semibold text-gray-900 truncate">
        {value}
      </span>
    </div>
  );
};

export const StatCard = memo(StatCardComponent);
