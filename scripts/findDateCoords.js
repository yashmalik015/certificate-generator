import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function testExact() {
  const img = await loadImage('src/assets/certificate-templates/Arya Bhushan Samaj Seva Award.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('08-09-2026', 400, 893);

  fs.writeFileSync('scripts/test_date_exact.png', canvas.toBuffer('image/png'));
  console.log('Saved test_date_exact.png');
}

testExact();
