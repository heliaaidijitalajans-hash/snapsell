import { memo, useCallback } from "react";

type SelectableChipProps = {
  id: string;
  label: string;
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Website port of SnapSell Mobile `SelectableChip` — animated pill for compact
 * single-select option groups. Same behavior (red fill + white label on
 * select), adapted to the website's light theme.
 */
const SelectableChipComponent = ({
  id,
  label,
  selected,
  onSelect,
}: SelectableChipProps) => {
  const handlePress = useCallback(() => onSelect(id), [id, onSelect]);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={handlePress}
      className={`h-11 px-4 rounded-full border-[1.5px] flex items-center justify-center text-sm font-bold transition-colors duration-150 ${
        selected
          ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
};

export const SelectableChip = memo(SelectableChipComponent);
