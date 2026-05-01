// Generate styled QR codes for the landing page.
//
// - Decodes the WeChat QR from the source screenshot (jsqr) to recover the
//   underlying weixin:// URL — that hash is per-user and can't be reconstructed.
// - Generates fresh QRs (qrcode) at consistent size / margin / EC level.
// - Composites a brand-colored center logo (with white safe-zone padding) by
//   appending SVG groups before </svg> on the qrcode lib's output.
// - Logos are simplified custom SVG, not rasterized brand icons.

import jsQR from 'jsqr';
import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = 'C:/Users/Eddy-/Documents/qrs';
const OUTPUT_DIR = path.resolve('public');

const QR_PIXELS = 600;
const QR_MARGIN_MODULES = 2;
const LOGO_RATIO = 0.22;            // logo size ÷ QR size
const SAFE_ZONE_PAD = 16;           // white padding around logo (px in viewBox)

async function decodeQRImage(imagePath) {
  // Try multiple preprocessing strategies — original image may have low contrast,
  // resize artifacts, or the QR sits in a larger screenshot frame.
  const strategies = [
    { name: 'original', pipeline: (s) => s },
    { name: 'resize-800', pipeline: (s) => s.resize(800, 800, { fit: 'inside' }) },
    { name: 'resize-1200', pipeline: (s) => s.resize(1200, 1200, { fit: 'inside' }) },
    { name: 'grayscale', pipeline: (s) => s.grayscale() },
    { name: 'grayscale+resize-800', pipeline: (s) => s.grayscale().resize(800, 800, { fit: 'inside' }) },
    { name: 'normalize+grayscale', pipeline: (s) => s.normalize().grayscale() },
  ];
  for (const { name, pipeline } of strategies) {
    const { data, info } = await pipeline(sharp(imagePath))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    console.log(`  try [${name}] ${info.width}x${info.height} ch=${info.channels} bytes=${data.length}`);
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (decoded) {
      console.log(`  ✓ decoded with [${name}]`);
      return decoded.data;
    }
  }
  throw new Error(`Could not decode QR: ${imagePath}`);
}

// 24x24 viewBox icons drawn in white — meant to render on a brand-color square.
const WECHAT_ICON_24 = `
  <ellipse cx="9.5" cy="9.5" rx="6.5" ry="5.3" fill="white"/>
  <path d="M5.2 13 L4 16 L7 14 Z" fill="white"/>
  <circle cx="7.3" cy="9" r="1" fill="#07C160"/>
  <circle cx="11.7" cy="9" r="1" fill="#07C160"/>
  <ellipse cx="15.5" cy="15" rx="5.3" ry="4.2" fill="white"/>
  <path d="M19.2 17.5 L20.5 19.8 L18 18.4 Z" fill="white"/>
  <circle cx="13.4" cy="14.4" r="0.85" fill="#07C160"/>
  <circle cx="17.5" cy="14.4" r="0.85" fill="#07C160"/>
`;

const INSTAGRAM_ICON_24 = `
  <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="white" stroke-width="2"/>
  <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" stroke-width="2"/>
  <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
`;

function logoOverlaySvg({ brandFill, defs = '', innerSvg }) {
  const cx = QR_PIXELS / 2;
  const cy = QR_PIXELS / 2;
  const logoSize = QR_PIXELS * LOGO_RATIO;
  const outerSize = logoSize + SAFE_ZONE_PAD * 2;
  return `
    ${defs}
    <rect x="${cx - outerSize / 2}" y="${cy - outerSize / 2}"
          width="${outerSize}" height="${outerSize}"
          rx="${outerSize * 0.18}" fill="white"/>
    <rect x="${cx - logoSize / 2}" y="${cy - logoSize / 2}"
          width="${logoSize}" height="${logoSize}"
          rx="${logoSize * 0.22}" fill="${brandFill}"/>
    <g transform="translate(${cx - logoSize / 2}, ${cy - logoSize / 2}) scale(${logoSize / 24})">
      ${innerSvg}
    </g>
  `;
}

const wechatLogo = logoOverlaySvg({
  brandFill: '#07C160',
  innerSvg: WECHAT_ICON_24,
});

const instagramLogo = logoOverlaySvg({
  brandFill: 'url(#igGrad)',
  defs: `
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#feda75"/>
        <stop offset="25%" stop-color="#fa7e1e"/>
        <stop offset="50%" stop-color="#d62976"/>
        <stop offset="75%" stop-color="#962fbf"/>
        <stop offset="100%" stop-color="#4f5bd5"/>
      </linearGradient>
    </defs>
  `,
  innerSvg: INSTAGRAM_ICON_24,
});

async function generateQR(data, logoSvg, outputPath) {
  const qrSvg = await QRCode.toString(data, {
    type: 'svg',
    width: QR_PIXELS,
    margin: QR_MARGIN_MODULES,
    errorCorrectionLevel: 'H',
    color: { dark: '#0a0a14', light: '#ffffff' },
  });
  const final = qrSvg.replace('</svg>', logoSvg + '</svg>');
  fs.writeFileSync(outputPath, final);
  console.log(`✓ ${outputPath}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const wechatUrl = await decodeQRImage(path.join(INPUT_DIR, 'wechat.jpg'));
  console.log('Decoded WeChat:', wechatUrl);
  const instagramUrl = 'https://instagram.com/non_ink_l';
  console.log('Instagram:', instagramUrl);

  await generateQR(wechatUrl, wechatLogo, path.join(OUTPUT_DIR, 'wechat-qr.svg'));
  await generateQR(instagramUrl, instagramLogo, path.join(OUTPUT_DIR, 'ig-qr.svg'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
