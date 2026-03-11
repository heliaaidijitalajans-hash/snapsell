/**
 * Vercel serverless: PhotoRoom v2 Edit = arka plan silme + kullanıcı promptuna göre yeni arka plan oluşturma.
 * Frontend: { image: base64 data URL, prompt: string }.
 * Requires PHOTOROOM_API_KEY in Vercel env.
 */
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.PHOTOROOM_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Missing PHOTOROOM_API_KEY env variable"
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON body" });
  }

  const image = body.image;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ success: false, error: "Body must include image (base64 data URL)" });
  }

  let buf;
  try {
    const base64Part = image.replace(/^data:image\/\w+;base64,/, "");
    if (!base64Part) return res.status(400).json({ success: false, error: "Invalid base64 image" });
    buf = Buffer.from(base64Part, "base64");
    if (buf.length > 10 * 1024 * 1024) return res.status(400).json({ success: false, error: "Görsel 10 MB'dan küçük olmalı" });
  } catch (e) {
    return res.status(400).json({ success: false, error: "Geçersiz base64 görsel" });
  }

  const bgPrompt = (body.prompt && typeof body.prompt === "string")
    ? String(body.prompt).trim().slice(0, 500)
    : "professional product photography, studio lighting, clean neutral background, soft shadows";

  try {
    const FormData = globalThis.FormData;
    const form = new FormData();
    const blob = new Blob([buf], { type: "image/png" });
    form.append("imageFile", blob, "image.png");
    form.append("removeBackground", "true");
    form.append("referenceBox", "subjectBox");
    form.append("scaling", "fit");
    form.append("outputSize", "1200x1200");
    form.append("padding", "0.12");
    form.append("background.prompt", bgPrompt);

    const phRes = await fetch("https://image-api.photoroom.com/v2/edit", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PHOTOROOM_API_KEY,
        "pr-ai-background-model-version": "background-studio-beta-2025-03-17"
      },
      body: form
    });

    console.log("[photoroom/pipeline] PhotoRoom response status:", phRes.status);

    if (!phRes.ok) {
      const errText = await phRes.text();
      console.log("[photoroom/pipeline] PhotoRoom error body:", errText.slice(0, 800));
      let detail = errText.slice(0, 400);
      try {
        const j = JSON.parse(errText);
        const raw = j.message || j.error || j.detail || detail;
        detail = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? (raw.message || raw.error || JSON.stringify(raw)) : String(raw));
      } catch (_) {}
      const detailStr = typeof detail === "string" ? detail : JSON.stringify(detail || "");
      const isExhausted = /exhausted|number of images|plan.*limit|kotanız.*doldu/i.test(detailStr);
      const status = phRes.status === 402 ? 402 : phRes.status === 401 ? 401 : 502;
      return res.status(status).json({
        success: false,
        error: isExhausted
          ? "PhotoRoom aylık görsel kotanız dolmuş. Image Editing (Plus) planınızı veya kredinizi https://app.photoroom.com/api-dashboard adresinden yenileyin."
          : (detailStr ? "PhotoRoom: " + detailStr.slice(0, 220) : "PhotoRoom API hatası."),
        ...(isExhausted && { upgradeUrl: "/fiyatlandirma", billingUrl: "https://app.photoroom.com/api-dashboard", photoroomDashboardUrl: "https://app.photoroom.com/api-dashboard" })
      });
    }

    const resultBuf = Buffer.from(await phRes.arrayBuffer());
    console.log("[photoroom/pipeline] PhotoRoom success body length:", resultBuf ? resultBuf.length : 0);
    if (!resultBuf || resultBuf.length === 0) {
      return res.status(502).json({ success: false, error: "PhotoRoom boş yanıt döndü." });
    }
    const resultBase64 = resultBuf.toString("base64");
    const dataUrl = "data:image/png;base64," + resultBase64;

    let seoText = "";
    let priceSummary = null;
    let priceAnalysis = [];
    const productDesc = (body.productDescriptionForPriceAnalysis && String(body.productDescriptionForPriceAnalysis).trim()) || "";

    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const seoRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Bu urun fotografini analiz et ve SEO aciklamasi yaz" },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }]
        });
        seoText = (seoRes.choices?.[0]?.message?.content || "").trim();

        const { getPriceAnalysisUnified } = await import("../../lib/price-analysis.js");
        const unified = await getPriceAnalysisUnified(dataUrl, productDesc, seoText);
        if (unified && unified.platforms && unified.platforms.length > 0) {
          priceSummary = unified.summaryText || "";
          priceAnalysis = unified.platforms;
        } else {
          const priceRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Bu urun fotografini analiz et ve fiyat analizi yap. Urunun tahmini piyasa fiyati (TL), platform fiyat araligi, onerilen satis fiyati ve rekabetci fiyatlandirma stratejisi belirt."
                },
                { type: "image_url", image_url: { url: dataUrl } }
              ]
            }]
          });
          priceSummary = (priceRes.choices?.[0]?.message?.content || "").trim() || null;
        }
      } catch (openaiErr) {
        console.error("[photoroom/pipeline] OpenAI SEO/fiyat:", openaiErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      image: dataUrl,
      outputUrl: dataUrl,
      output: [dataUrl],
      seo: seoText || undefined,
      priceSummary: priceSummary || undefined,
      priceAnalysis
    });
  } catch (e) {
    console.error("[photoroom/pipeline] Error:", e.message);
    console.error("[photoroom/pipeline] Stack:", e.stack);
    return res.status(500).json({
      success: false,
      error: e.message || "PhotoRoom isteği başarısız.",
      stack: e.stack || undefined
    });
  }
}
