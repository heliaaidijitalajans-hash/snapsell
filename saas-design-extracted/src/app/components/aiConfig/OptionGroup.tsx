import { SelectableCard } from "./SelectableCard";
import { SelectableChip } from "./SelectableChip";
import type { ConfigOption } from "../../services/aiConfig/aiConfigContent";

type OptionGroupProps = {
  title: string;
  options: readonly ConfigOption[];
  value: string | null;
  onSelect: (id: string) => void;
  variant: "grid" | "chips";
  error?: string;
};

/**
 * Website port of SnapSell Mobile `ControlledOptionGroup` — a titled section of
 * either grid cards or chips, single-select, surfacing a validation error.
 * Reused for every configuration section (DRY).
 */
export function OptionGroup({
  title,
  options,
  value,
  onSelect,
  variant,
  error,
}: OptionGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div
        className={
          variant === "grid"
            ? "flex flex-wrap gap-3"
            : "flex flex-wrap gap-2"
        }
      >
        {options.map((option) =>
          variant === "grid" ? (
            <SelectableCard
              key={option.id}
              id={option.id}
              label={option.label}
              selected={value === option.id}
              onSelect={onSelect}
            />
          ) : (
            <SelectableChip
              key={option.id}
              id={option.id}
              label={option.label}
              selected={value === option.id}
              onSelect={onSelect}
            />
          ),
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#FF5252] ml-1" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
