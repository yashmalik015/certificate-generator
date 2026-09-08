import { loadImage, createCanvas } from 'canvas';
import path from 'path';

async function sampleTones() {
  const dir = '/Users/yashmalik/.gemini/antigravity-ide/brain/4b8f9276-e43d-4ad8-b7d4-ad6026c1fa31/.user_uploaded';
  const files = [
    { f: 'media_1788854868587.jpg', name: 'Arya Bhushan' },
    { f: 'media_1788854868611.jpg', name: 'Best Business' },
    { f: 'media_1788854868644.jpg', name: 'Padma Bhushan' },
    { f: 'media_1788854868661.jpg', name: 'Gaurav Ratan' },
    { f: 'media_1788854868669.jpg', name: 'Women Icon' }
  ];

  for (const item of files) {
    const img = await loadImage(path.join(dir, item.f));
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Sample from multiple points in the top-left area between lines
    const p1 = ctx.getImageData(170, 70, 1, 1).data;
    const p2 = ctx.getImageData(170, 100, 1, 1).data;
    const p3 = ctx.getImageData(170, 130, 1, 1).data;

    // Convert to hex
    const hex = (p) => '#' + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('');
    console.log(`${item.name}: p1=${hex(p1)}, p2=${hex(p2)}, p3=${hex(p3)}`);
  }
}

sampleTones();
