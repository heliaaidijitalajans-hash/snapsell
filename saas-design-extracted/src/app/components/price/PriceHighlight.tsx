import { memo } from "react";

type PriceHighlightProps = {
  label: string;
  /** Pre-formatted, currency-aware price string. */
  formattedPrice: string;
  caption?: string;
};

/**
 * Website port of SnapSell Mobile `PriceHighlight` — the average marketplace
 * price presented as the visual anchor of the pricing decision. Consumes a
 * pre-formatted (currency-aware) string; adapted to the website's light theme
 * with the primary-bordered card the mobile app uses.
 */
const PriceHighlightComponent = ({
  label,
  formattedPrice,
  caption,
}: PriceHighlightProps) => {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-[#FF5A5F] px-6 py-8 shadow-sm">
      <span className="text-xs text-gray-500 tracking-wide uppercase">
        {label}
      </span>
      <span
        className="text-[#FF5A5F] font-extrabold leading-none"
        style={{ fontSize: 52, lineHeight: "58px" }}
        aria-label={formattedPrice}
      >
        {formattedPrice}
      </span>
      {caption ? (
        <span className="text-xs text-gray-500 text-center">{caption}</span>
      ) : null}
    </div>
  );
};

export const PriceHighlight = memo(PriceHighlightComponent);
