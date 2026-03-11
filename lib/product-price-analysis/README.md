# Product Price Analysis System

Pipeline: **image → product extraction → search query → price search (SerpAPI) → cleaning → market stats → recommended sale price.**

## Output

```json
{
  "product": {
    "brand": "",
    "model": "",
    "product_type": "",
    "color": "",
    "category": ""
  },
  "market_analysis": {
    "average_price": number,
    "median_price": number,
    "price_range": { "min": number, "max": number }
  },
  "recommended_sale_price": number,
  "listings": [
    { "title": "", "price": number, "platform": "", "url": "" }
  ]
}
```

- **recommended_sale_price** = `average_price * 0.95` (sell faster than competitors).

## Platforms (allowed domains)

Amazon, Amazon Turkey, Etsy, Trendyol, Hepsiburada, N11, Ciceksepeti. Only results from these domains are kept.

## Usage

```js
import { runProductPriceAnalysis, runProductPriceAnalysisFromText } from "./lib/product-price-analysis/index.js";

// With image (data URL or URL)
const result = await runProductPriceAnalysis(imageUrl, { userHint: "optional", gl: "us" });

// Text-only search
const result = await runProductPriceAnalysisFromText("Nike Air Force 1 white sneakers", { gl: "tr" });
```

## Env

- `OPENAI_API_KEY` – vision (product extraction)
- `SERPAPI_API_KEY` – Google Shopping

## Modules

| Module | Role |
|--------|------|
| `image-analysis.js` | Vision → product JSON (brand, model, product_type, color, category) |
| `search-query.js` | brand + model + product_type |
| `price-search.js` | SerpAPI Google Shopping, filter by allowed platforms |
| `price-cleaning.js` | Numeric prices, dedup, remove ±50% median outliers |
| `market-stats.js` | median, average, min/max, recommended_sale_price = average * 0.95 |
| `index.js` | Run pipeline, return final output |
