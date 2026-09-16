import fs from 'fs';
import { createCanvas, loadImage, registerFont } from 'canvas';

async function test() {
  const bg = await loadImage('/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789548092282.jpg');
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0);

  // Photo Box coords (from template)
  const px = 250, py = 527, pw = 186, ph = 210;
  
  // Dummy photo
  ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 8);
  else ctx.rect(px, py, pw, ph);
  ctx.fill();

  // Name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 26px "Times New Roman", serif';
  ctx.fillStyle = '#0f2137'; // Almost black
  ctx.fillText("Dr. Vinod Kumar Mishra", canvas.width / 2, 768);

  // Category in sentence: "For his exceptional work as a [Category],"
  // We can't easily replace just that word in a baked image if the surrounding text is baked in.
  // Let's check if the text "For his exceptional work as a" is in the blank template.
  // YES! The blank template has: "For his exceptional work as a Wild Life Expert, notable accomplishments,"
  // Wait, if the blank template ALREADY has "Wild Life Expert", how can we change it dynamically?
  // We have to draw a white box over "Wild Life Expert" or the whole sentence, and rewrite it!
  
  // Date
  ctx.font = 'bold 15px "Times New Roman", serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText("26-12-2025", 412, 882); // estimate

  // Signatures
  ctx.font = 'italic bold 22px "Times New Roman", serif';
  ctx.fillStyle = '#1a3380';
  ctx.fillText("Signature1", 160, 890);
  ctx.fillText("Signature2", canvas.width - 160, 890);

  // Top Right QR code
  ctx.fillStyle = 'blue';
  ctx.fillRect(525, 95, 75, 75);

  const out = 'scripts/gaurav_test.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log('Saved to', out);
}

test().catch(console.error);
