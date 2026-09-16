import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const destDirs = [
  path.resolve(rootDir, 'src/assets/certificate-templates'),
  path.resolve(rootDir, 'public/assets/certificate-templates'),
  path.resolve(rootDir, 'public/certificate-templates')
];

async function run() {
  const sourceImage = '/Users/yashmalik/.gemini/antigravity-ide/brain/2d09883f-1947-4bd3-9515-56d10d8983e9/.user_uploaded/media_1789546067277.jpg';
  
  if (!fs.existsSync(sourceImage)) {
    console.error('Source image not found!');
    return;
  }

  const baseImg = await loadImage(sourceImage);
  const canvas = createCanvas(baseImg.width, baseImg.height);
  const ctx = canvas.getContext('2d');
  
  // Draw exactly as is
  ctx.drawImage(baseImg, 0, 0);

  const pngBuf = canvas.toBuffer('image/png');

  const pdfDoc = await PDFDocument.create();
  const embeddedImg = await pdfDoc.embedPng(pngBuf);
  const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
  page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
  const pdfBuf = await pdfDoc.save();

  for (const d of destDirs) {
    if (fs.existsSync(d)) {
      const name = 'Bhartiya Padma Bhushan Samman';
      fs.writeFileSync(path.join(d, `${name}.png`), pngBuf);
      fs.writeFileSync(path.join(d, `${name}.pdf`), pdfBuf);
    }
  }
  console.log(`Updated Padma Bhushan template successfully. Resolution: ${baseImg.width}x${baseImg.height}`);
}

run().catch(console.error);
