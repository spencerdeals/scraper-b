
# Scraper B (clean)

Lightweight scrape API that returns `{ name, price, image, variants }` for a product URL.

## Endpoints
- `GET /health` → `{ ok: true }`
- `POST /scrape` body `{ "url": "<product-url>" }` → product JSON

## Deploy
1) New repo in GitHub → add these files.
2) Railway → New Project → Deploy from GitHub.
3) Start Command: `npm start`. Node ≥ 18.

## Test
```bash
curl -s https://<your-domain>/health
curl -s https://<your-domain>/scrape -H "Content-Type: application/json" -d '{"url":"https://www.amazon.com/dp/B0FDWCDT1V"}'
```
