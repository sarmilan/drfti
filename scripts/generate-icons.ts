import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const SIZES = [192, 512] as const;
const BG = '#0A0A0F';
const FG = '#E94560';
const LABEL = 'drfti';

function generate(size: number, outPath: string) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  // Text
  const fontSize = Math.round(size * 0.22);
  ctx.fillStyle = FG;
  ctx.font = `700 ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(LABEL, size / 2, size / 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of SIZES) {
  generate(size, path.join(iconsDir, `icon-${size}.png`));
}
