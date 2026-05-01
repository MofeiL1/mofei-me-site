# mofei-me-site

Personal landing page at [mofei.me](https://mofei.me/).

Static HTML/CSS/SVG, no build step. Cloudflare Pages serves [`public/`](public/) directly.

## Layout

```
mofei-me-site/
├── public/                  ← deploy this
│   ├── index.html
│   ├── style.css
│   ├── favicon.svg
│   ├── ig-qr.svg
│   └── wechat-qr.svg
├── scripts/
│   └── generate-qrs.js      ← regen QRs from C:/Users/Eddy-/Documents/qrs/
├── package.json             ← dev deps for QR generation
└── .gitignore
```

## Deploy (Cloudflare Pages)

- Connect repo
- Build command: (empty)
- Build output directory: `public`
- Custom domain: `mofei.me`

## Regenerate QRs

If you switch IG handle or WeChat profile:

1. Drop new screenshots into `C:/Users/Eddy-/Documents/qrs/` (`wechat.jpg`, `instagram.jpg`)
2. Update `instagramUrl` in `scripts/generate-qrs.js` if the IG handle changed
3. `npm install && npm run regen-qrs`
4. Commit the updated `public/*-qr.svg` and push
