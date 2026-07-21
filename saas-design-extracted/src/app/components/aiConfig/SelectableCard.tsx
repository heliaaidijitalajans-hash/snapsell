import { memo, useCallback } from "react";
import { Check } from "lucide-react";

type SelectableCardProps = {
  id: string;
  label: string;
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Website port of SnapSell Mobile `SelectableCard` — animated grid card for
 * single-select option groups. Same behavior (red border + tint + check badge
 * on select), adapted to the website's light theme.
 */
const SelectableCardComponent = ({
  id,
  label,
  selected,
  onSelect,
}: SelectableCardProps) => {
  const handlePress = useCallback(() => onSelect(id), [id, onSelect]);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={handlePress}
      className={`relative basis-[47%] grow min-h-[60px] px-4 py-3 rounded-[18px] border-[1.5px] flex items-center justify-center text-center transition-colors duration-150 ${
        selected
          ? "border-[#FF5A5F] bg-[#FF5A5F]/[0.12]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span
        className={`text-base font-semibold ${selected ? "text-gray-900" : "text-gray-500"}`}
      >
        {label}
      </span>
      <span
        className={`absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-[#FF5A5F] flex items-center justify-center transition-all duration-150 ${
          selected ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
        aria-hidden
      >
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </span>
    </button>
  );
};

export const SelectableCard = memo(SelectableCardComponent);
