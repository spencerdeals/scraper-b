
// Scraper B — minimal scrape API for product name, price, image, variants
// Usage: POST /scrape { "url": "https://www.amazon.com/dp/..." }
// Returns: { name, price, image, variants }
// For production, you can later swap in Playwright/stealth. This version uses fetch + regex.

import express from "express";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: (o, cb) => cb(null, true) }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "scraper-b", version: "1.0.0" });
});

app.post("/scrape", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "url required" });

    const u = new URL(url);
    let result = null;

    if (/amazon\./i.test(u.hostname)) {
      result = await scrapeAmazon(url);
    } else {
      result = await scrapeGeneric(url);
    }

    if (!result || (!result.name && !result.price)) {
      return res.status(422).json({ error: "Could not extract details" });
    }
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// ---------- Scrapers ----------

async function scrapeAmazon(url) {
  const html = await fetchHtml(url);
  const out = { name: null, price: null, image: null, variants: [] };

  // Title
  let m = html.match(/<span[^>]*id=["']productTitle["'][^>]*>([^<]+)<\/span>/i);
  if (m) out.name = cleanup(m[1]);

  // Price (several candidates)
  let p;
  p = html.match(/"priceToPay"[^}]*"amount"\s*:\s*([0-9.]+)/i);
  if (p) out.price = parseFloat(p[1]);
  if (out.price == null) {
    p = html.match(/"price"\s*:\s*\{[^}]*"amount"\s*:\s*([0-9.]+)/i);
    if (p) out.price = parseFloat(p[1]);
  }
  if (out.price == null) {
    p = html.match(/<span[^>]*class=["']a-offscreen["'][^>]*>\$([0-9.,]+)<\/span>/i);
    if (p) out.price = parseFloat(p[1].replace(/,/g,""));
  }

  // Image
  let i;
  i = html.match(/"hiRes":"(https:[^"]+)"/i);
  if (i) out.image = decode(i[1]);
  if (!out.image) {
    i = html.match(/"large":"(https:[^"]+)"/i);
    if (i) out.image = decode(i[1]);
  }
  if (!out.image) {
    i = html.match(/<img[^>]*id=["']landingImage["'][^>]*data-old-hires=["'](https:[^"']+)["']/i);
    if (i) out.image = i[1];
  }

  // Variants (color/configuration best-effort)
  const dv = html.match(/"dimensionValuesDisplayData"\s*:\s*(\{[^}]+\})/i);
  if (dv) {
    try {
      const raw = dv[1].replace(/\\u0022/g, '"');
      const obj = JSON.parse(raw);
      for (const k of Object.keys(obj)) out.variants.push(`${k}: ${obj[k]}`);
    } catch {}
  } else {
    const color = html.match(/"color_name"\s*:\s*"([^"]+)"/i);
    const style = html.match(/"style_name"\s*:\s*"([^"]+)"/i);
    if (color) out.variants.push(`Color: ${cleanup(color[1])}`);
    if (style) out.variants.push(`Configuration: ${cleanup(style[1])}`);
  }

  return out;
}

async function scrapeGeneric(url) {
  const html = await fetchHtml(url);
  const out = { name: null, price: null, image: null, variants: [] };
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitle) out.name = cleanup(ogTitle[1]);
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage) out.image = decode(ogImage[1]);
  const m = html.match(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
  if (m) out.price = parseFloat(m[1].replace(/,/g,""));
  return out;
}

// ---------- Utils ----------
async function fetchHtml(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
  return await resp.text();
}
function cleanup(s){ return String(s).replace(/\s+/g," ").trim(); }
function decode(s){ return s.replace(/\\u0026/g,"&"); }

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scraper B running on", PORT));
