import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const bg = await loadImage('src/assets/certificate-templates/Bhartiye Gaurav Ratan Samman.jpg');
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0);

  // Cover up "Wild Life Expert"
  // Let's guess the bounding box
  ctx.fillStyle = '#f8f5eb'; // guess background color
  ctx.fillRect(360, 815, 120, 18); // This is a guess, let's just make it visible
  ctx.fillStyle = 'red';
  ctx.font = 'bold 12px "Times New Roman"';
  ctx.fillText("Dynamic Cat", 365, 828);

  // Signatures
  ctx.font = 'italic bold 22px "Times New Roman"';
  ctx.fillStyle = '#1a3380';
  ctx.fillText("Signature1", 160, 930);
  ctx.fillText("Signature2", canvas.width - 220, 930);

  // Photo
  ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
  ctx.fillRect(250, 527, 186, 210);

  const out = 'scripts/gaurav_test2.jpg';
  fs.writeFileSync(out, canvas.toBuffer('image/jpeg'));
  console.log('Saved to', out);
}

test().catch(console.error);
