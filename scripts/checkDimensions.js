import { loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

async function checkRaw() {
  const dir = '/Users/yashmalik/.gemini/antigravity-ide/brain/4b8f9276-e43d-4ad8-b7d4-ad6026c1fa31/.user_uploaded';
  const files = [
    'media_1788854868587.jpg',
    'media_1788854868611.jpg',
    'media_1788854868644.jpg',
    'media_1788854868661.jpg',
    'media_1788854868669.jpg'
  ];
  for (const f of files) {
    const img = await loadImage(path.join(dir, f));
    console.log(`${f}: ${img.width}x${img.height}`);
  }
}

checkRaw();
