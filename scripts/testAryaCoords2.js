import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789544139304.jpg'; // The blank template
  const img = await loadImage(imgPath);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const cleanRefno = 'CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. 459383/IHREO028\nReg No. 459383';
  const nameStr = 'Dr. Mahendran G';
  const dateStr = '18/02/26';

  // 1. Top Left Text
  ctx.fillStyle = '#111827';
  ctx.font = '7px Arial';
  ctx.textAlign = 'left';
  const lines = cleanRefno.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 105, 82 + (i * 10)); // Top-down
  });

  // 2. Profile Pic
  ctx.fillStyle = '#cccccc';
  const picW = 82;
  const picH = 96;
  const picX = (img.width - picW) / 2;
  const picY = 370; // top down
  // Draw rounded rect
  ctx.beginPath();
  ctx.roundRect(picX, picY, picW, picH, 6);
  ctx.fill();

  // 3. Name 
  ctx.fillStyle = '#991b1b';
  ctx.font = 'italic bold 23px "Times New Roman"';
  // Baseline is around 543
  ctx.fillText(nameStr, 252, 543);

  // 4. Date
  ctx.fillStyle = '#991b1b';
  ctx.font = 'italic bold 12px "Times New Roman"';
  ctx.fillText(dateStr, 442, 898);

  // 5. QR Code
  ctx.fillStyle = '#000000';
  ctx.fillRect(618, 70, 62, 62); // Top right

  const out = '/Users/yashmalik/Desktop/certificate website/CertificateWeb/scripts/coord_test2.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log(`Test image saved to ${out}`);
}

test().catch(console.error);
