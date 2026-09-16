import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const imgPath = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789546067277.jpg'; // The blank template
  const bgImg = await loadImage(imgPath);
  
  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bgImg, 0, 0);

  // A random face photo from internet for testing if possible, or just a generic colored rect
  // Since we don't have a local photo, let's just make a dummy portrait image
  const dummyPhotoCanvas = createCanvas(300, 400); // portrait
  const dctx = dummyPhotoCanvas.getContext('2d');
  dctx.fillStyle = 'red';
  dctx.fillRect(0, 0, 300, 400);
  dctx.fillStyle = 'blue';
  dctx.fillRect(50, 50, 200, 300); // inner
  const pImg = await loadImage(dummyPhotoCanvas.toBuffer('image/png'));

  // Test circular clipping
  const photoD = 138;
  const picX = (canvas.width - photoD) / 2;
  const picY = 343 - (photoD / 2);
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(picX + photoD/2, picY + photoD/2, photoD/2, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(pImg, picX, picY, photoD, photoD);
  ctx.restore();
  
  ctx.beginPath();
  ctx.arc(picX + photoD/2, picY + photoD/2, photoD/2, 0, 2 * Math.PI);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  const out = '/Users/yashmalik/Desktop/certificate website/CertificateWeb/scripts/padma_clip_test.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log(`Test image saved to ${out}`);
}

test().catch(console.error);
