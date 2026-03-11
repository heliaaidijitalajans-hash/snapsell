# Price analysis pipeline (V2)

Accurate price estimation from product images: structured identification → precise search → Google Shopping → cleaning → median/avg/range.

## Flow

1. **Image analysis** (`image-analysis.js`) – Vision model returns structured JSON: `brand`, `model`, `product_type`, `color`, `material`, `condition`.
2. **Search query** (`search-query.js`) – Builds query from: `brand + model + product_type + color`.
3. **SerpAPI** (`serp-shopping.js`) – `engine=google_shopping` only. Extracts: `title`, `price`, `store`, `link`.
4. **Cleaning** (`cleaning.js`) – Remove duplicates; remove prices outside ±50% of median; remove listings without product match.
5. **Price stats** (`price-stats.js`) – Median, average (after outliers), min, max, formatted `price_range`.

## Output

```json
{
  "product_identification": { "brand": "", "model": "", "product_type": "", "color": "", "material": "", "condition": "" },
  "price_analysis": { "median_price": "₺X", "average_price": "₺Y", "price_range": "₺A – ₺B" },
  "sources": [{ "title": "...", "price": 123, "store": "...", "link": "..." }]
}
```

## Usage

- **With image:** `runPricePipeline(imageUrl, { userHint: "optional text" })`
- **Text only:** `runPricePipelineFromText("Nike Air Max white")`

From `lib/price-analysis.js`: `getPriceAnalysisV2(imageUrl, userHint)` returns this format. `getPriceAnalysisUnified()` uses the pipeline first and maps to legacy `platforms` + `summaryText` for the existing UI.

## Env

- `OPENAI_API_KEY` – vision (structured extraction)
- `SERPAPI_API_KEY` – Google Shopping

## Extending

- Add another search source in a new module and merge listings before `cleanListings()`.
- Tune `OUTLIER_MEDIAN_TOLERANCE` in `types.js` (default 0.5 = ±50%).
- Change `buildSearchQuery()` to include `material` or `condition` if needed.
