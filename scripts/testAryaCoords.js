import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789544139304.jpg';
  const img = await loadImage(imgPath);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Data
  const cleanRefno = 'CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. 459383/IHREO028\nReg No. 459383';
  const nameStr = 'Dr. Mahendran G';
  const dateStr = '18/02/26';

  // 1. Top Left Text
  ctx.fillStyle = '#111827';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  const lines = cleanRefno.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 105, 80 + (i * 14));
  });

  // 2. Profile Pic (placeholder rect for now)
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(305, 355, 114, 130);
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 2;
  ctx.strokeRect(305, 355, 114, 130);

  // 3. Name 
  ctx.fillStyle = '#800000'; // Dark red for name
  ctx.font = 'bold 24px "Times New Roman"';
  // Position is right of "Mr. / Ms."
  ctx.fillText(nameStr, 245, 545);

  // 4. Date
  ctx.fillStyle = '#111827';
  ctx.font = '14px Arial';
  ctx.fillText(dateStr, 360, 898);

  const out = '/Users/yashmalik/Desktop/certificate website/CertificateWeb/scripts/coord_test.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log(`Test image saved to ${out}`);
}

test().catch(console.error);
