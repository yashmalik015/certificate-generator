import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function measure() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789544526959.jpg';
  const img = await loadImage(imgPath);
  console.log(`Filled image resolution: ${img.width}x${img.height}`);
  
  // Since it's exactly the same resolution as the blank template:
  // We can just output the coordinates visually by drawing bounding boxes and saving it for visual inspection or just by eye-balling from the original image if we can. 
  // Let's create an annotated test image that highlights specific coordinates so I can precisely know where to put things.
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // We want to find: 
  // 1. Top left text bounding box
  // 2. Profile picture bounding box
  // 3. Name bounding box
  // 4. Date bounding box
  
  // Draw grid
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  for (let x = 0; x < img.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, img.height); ctx.stroke();
    ctx.fillStyle = 'red'; ctx.fillText(x, x+2, 10);
  }
  for (let y = 0; y < img.height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(img.width, y); ctx.stroke();
    ctx.fillStyle = 'red'; ctx.fillText(y, 2, y-2);
  }

  const out = '/Users/yashmalik/Desktop/certificate website/CertificateWeb/scripts/grid_test.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log(`Grid image saved to ${out}`);
}

measure().catch(console.error);
