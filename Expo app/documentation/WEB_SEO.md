# SEO — web (Wonderweave)

Production SEO lives in the Next.js app (repo root), not in the Expo shell.

## Surfaces

| File | Role |
| --- | --- |
| `src/app/layout.tsx` | Title, description, keywords, OG/Twitter, robots, JSON-LD |
| `src/app/sitemap.ts` | Absolute sitemap (`NEXT_PUBLIC_SITE_URL`) |
| `src/app/robots.ts` | Allow all + sitemap/host |
| `public/manifest.webmanifest` | PWA name/description/categories |
| `public/og-image.png` | Social share image (1200×630) |

## Launch checklist

1. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin (see `.env.example`).
2. `npm run build` and deploy `out/`.
3. Submit `https://YOUR_DOMAIN/sitemap.xml` in Google Search Console.
4. Verify rich results / OG with [Rich Results Test](https://search.google.com/test/rich-results) and a social debugger.
5. Keep copy benefit-led (cozy, offline, match-3) — do not stuff competitor trademarks into meta keywords.

## Competitive intent (honest)

Match-3 SERPs are dominated by large publishers. Strong technical SEO + clear niche positioning helps; installs, reviews, and retention win rankings over time. See also [`PLAY_STORE.md`](./PLAY_STORE.md) for Android ASO.
