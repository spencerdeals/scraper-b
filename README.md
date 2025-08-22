
# Scraper B

Minimal scrape API that returns name, price, image, and variants for a product URL.

## Endpoints

- `GET /health` → `{ ok: true }`
- `POST /scrape` with JSON body `{ "url": "<product-url>" }` → `{ name, price, image, variants }`

## Deploy on Railway

1. Create a new Railway project connected to this repo.
2. Set **Start Command** to `npm start` (or leave blank if Railway detects it).
3. Deploy. Copy the public URL from Settings → Domains.
4. Your main backend should set `SCRAPER_B_URL` to `<that-public-url>/scrape`.

## Local run

```bash
npm install
npm start
# In another terminal:
curl -s http://localhost:3000/scrape -H "Content-Type: application/json" -d '{"url":"https://www.amazon.com/dp/B0FDWCDT1V"}'
```
