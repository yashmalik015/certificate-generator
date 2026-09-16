import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789546067277.jpg'; // The blank template
  const img = await loadImage(imgPath);
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const nameStr = 'Dr. Jojo Koruth James';
  const dateStr = '26-Dec-2025';
  
  // 1. Photo (Circle)
  const picR = 72; // Radius
  const picX = img.width / 2;
  const picY = 343; // Center Y
  ctx.beginPath();
  ctx.arc(picX, picY, picR, 0, 2 * Math.PI);
  ctx.fillStyle = '#cccccc';
  ctx.fill();
  
  // 2. Name
  ctx.fillStyle = '#222222';
  ctx.font = 'bold 26px "Times New Roman"';
  ctx.textAlign = 'center';
  ctx.fillText(nameStr, img.width / 2, 606); // y from top

  // 3. Date
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 15px "Times New Roman"';
  ctx.fillText(dateStr, img.width / 2, 712); // y from top

  // 4. QR Code
  ctx.fillStyle = '#000000';
  ctx.fillRect(602, 70, 70, 70); // Top right

  // 5. Signatures (Meghna Shama & Isha Serial)
  ctx.fillStyle = '#1e3a8a'; // Dark blue script
  ctx.font = '24px "Brush Script MT", cursive';
  ctx.fillText("Meghna Shama", 200, 770);
  ctx.fillText("Isha Serial", img.width - 200, 770);


  const out = '/Users/yashmalik/Desktop/certificate website/CertificateWeb/scripts/padma_test.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log(`Test image saved to ${out}`);
}

test().catch(console.error);
