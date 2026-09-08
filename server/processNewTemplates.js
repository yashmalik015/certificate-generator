import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedDir = '/Users/yashmalik/.gemini/antigravity-ide/brain/4b8f9276-e43d-4ad8-b7d4-ad6026c1fa31/.user_uploaded';
const logoPath = path.resolve(__dirname, '../public/ihreo-logo.png');

// Create authentic Founder and Co-Founder calligraphic signature stamps
function drawSignature(ctx, type, x, y, color = '#0f2942') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (type === 'founder') {
    ctx.moveTo(x + 10, y + 22);
    ctx.bezierCurveTo(x + 22, y + 6, x + 35, y + 32, x + 48, y + 14);
    ctx.bezierCurveTo(x + 58, y + 4, x + 68, y + 28, x + 82, y + 16);
    ctx.lineTo(x + 95, y + 20);
    ctx.moveTo(x + 25, y + 18);
    ctx.lineTo(x + 70, y + 16);
    ctx.moveTo(x + 8, y + 28);
    ctx.bezierCurveTo(x + 38, y + 25, x + 75, y + 27, x + 105, y + 24);
    ctx.bezierCurveTo(x + 115, y + 23, x + 110, y + 33, x + 90, y + 31);
  } else {
    ctx.moveTo(x + 12, y + 14);
    ctx.bezierCurveTo(x + 20, y + 32, x + 30, y + 6, x + 42, y + 24);
    ctx.bezierCurveTo(x + 52, y + 14, x + 62, y + 28, x + 75, y + 16);
    ctx.bezierCurveTo(x + 85, y + 8, x + 95, y + 26, x + 105, y + 18);
    ctx.moveTo(x + 14, y + 28);
    ctx.bezierCurveTo(x + 42, y + 31, x + 80, y + 26, x + 108, y + 28);
  }
  ctx.stroke();
  ctx.restore();
}

async function saveTemplateFiles(canvas, baseName) {
  const pngBuf = canvas.toBuffer('image/png');

  const pdfDoc = await PDFDocument.create();
  const embeddedPng = await pdfDoc.embedPng(pngBuf);
  const page = pdfDoc.addPage([embeddedPng.width, embeddedPng.height]);
  page.drawImage(embeddedPng, { x: 0, y: 0, width: embeddedPng.width, height: embeddedPng.height });
  const pdfBytes = await pdfDoc.save();

  const targetDirs = [
    path.resolve(__dirname, '../src/assets'),
    path.resolve(__dirname, '../src/assets/certificate-templates'),
    path.resolve(__dirname, '../public/assets/certificate-templates'),
    path.resolve(__dirname, '../public/certificate-templates')
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${baseName}.png`), pngBuf);
    fs.writeFileSync(path.join(dir, `${baseName}.pdf`), pdfBytes);
  }

  console.log(`Saved pristine template: ${baseName}`);
}

async function processTemplates() {
  console.log('--- PROCESSING 5 NEW CERTIFICATE TEMPLATES WITH FLAWLESS INPAINTING ---');
  const officialLogo = await loadImage(logoPath);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Arya Bhushan Samaj Seva Award (media_1788854868587.jpg) - 728x1024
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n1. Processing Arya Bhushan Samaj Seva Award...');
  const img1 = await loadImage(path.join(uploadedDir, 'media_1788854868587.jpg'));
  const c1 = createCanvas(img1.width, img1.height);
  const ctx1 = c1.getContext('2d');
  ctx1.drawImage(img1, 0, 0);

  // Exact background fill for top-left CIN text (x: 80 to 305, y: 55 to 135)
  ctx1.fillStyle = '#fbfcec';
  ctx1.fillRect(80, 55, 225, 80);

  // Exact background fill for center old logo area (x: 295 to 430, y: 35 to 145)
  ctx1.fillStyle = '#fbfcec';
  ctx1.fillRect(295, 35, 135, 110);

  // Composite official IHREO logo cleanly
  ctx1.drawImage(officialLogo, 318, 44, 92, 92);

  // Clear pre-printed category line "International Business & Entrepreneurship," (y: 694 to 726)
  ctx1.fillStyle = '#fbfcec';
  ctx1.fillRect(80, 694, 568, 32);

  // Authentic Signatures above Founder & Co-Founder titles
  drawSignature(ctx1, 'founder', 135, 865, '#0f2942');
  drawSignature(ctx1, 'co-founder', 545, 865, '#0f2942');

  await saveTemplateFiles(c1, 'Arya Bhushan Samaj Seva Award');
  await saveTemplateFiles(c1, 'Bhartiya Samaj Seva award');

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Best Business Icon Award (media_1788854868611.jpg) - 714x1024
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n2. Processing Best Business Icon Award...');
  const img2 = await loadImage(path.join(uploadedDir, 'media_1788854868611.jpg'));
  const c2 = createCanvas(img2.width, img2.height);
  const ctx2 = c2.getContext('2d');
  ctx2.drawImage(img2, 0, 0);

  // Top-left CIN area fill (x: 60 to 285, y: 70 to 165)
  ctx2.fillStyle = '#eaf5fb';
  ctx2.fillRect(60, 70, 225, 95);

  // Top old crest fill (x: 285 to 430, y: 45 to 150)
  ctx2.fillStyle = '#edf6fb';
  ctx2.fillRect(285, 45, 145, 105);

  // Composite official IHREO logo
  ctx2.drawImage(officialLogo, 310, 52, 94, 94);

  // Signatures
  drawSignature(ctx2, 'founder', 125, 860, '#0f2942');
  drawSignature(ctx2, 'co-founder', 495, 860, '#0f2942');

  await saveTemplateFiles(c2, 'Best Business Icon Award');

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Bhartiya Padma Bhushan Samman (media_1788854868644.jpg) - 723x1024
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n3. Processing Bhartiya Padma Bhushan Samman...');
  const img3 = await loadImage(path.join(uploadedDir, 'media_1788854868644.jpg'));
  const c3 = createCanvas(img3.width, img3.height);
  const ctx3 = c3.getContext('2d');
  ctx3.drawImage(img3, 0, 0);

  // Inpaint clean gold metallic ribbon banner over "Dr. Jojo Koruth James"
  const ribbonGrad = ctx3.createLinearGradient(0, 412, 0, 452);
  ribbonGrad.addColorStop(0, '#e8c46c');
  ribbonGrad.addColorStop(0.2, '#fae8c0');
  ribbonGrad.addColorStop(0.5, '#f4d696');
  ribbonGrad.addColorStop(0.8, '#dcae54');
  ribbonGrad.addColorStop(1, '#b88934');
  ctx3.fillStyle = ribbonGrad;
  ctx3.beginPath();
  if (ctx3.roundRect) ctx3.roundRect(258, 414, 208, 36, 4);
  else ctx3.rect(258, 414, 208, 36);
  ctx3.fill();

  // Top emblem fill without touching "सत्यमेव जयते"
  ctx3.fillStyle = '#f8f2e4';
  ctx3.fillRect(310, 42, 105, 88);

  // Composite official IHREO logo
  ctx3.drawImage(officialLogo, 317, 44, 88, 88);

  // Signatures
  drawSignature(ctx3, 'founder', 135, 735, '#1a365d');
  drawSignature(ctx3, 'co-founder', 485, 735, '#1a365d');

  await saveTemplateFiles(c3, 'Bhartiya Padma Bhushan Samman');
  await saveTemplateFiles(c3, 'rashtriya padma bhushan samman');

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Bhartiye Gaurav Ratan Samman (media_1788854868661.jpg) - 681x1024
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n4. Processing Bhartiye Gaurav Ratan Samman...');
  const img4 = await loadImage(path.join(uploadedDir, 'media_1788854868661.jpg'));
  const c4 = createCanvas(img4.width, img4.height);
  const ctx4 = c4.getContext('2d');
  ctx4.drawImage(img4, 0, 0);

  // Top-left CIN area fill (x: 90 to 305, y: 95 to 175)
  ctx4.fillStyle = '#fffaec';
  ctx4.fillRect(90, 95, 215, 80);

  // Top emblem fill without touching "Regd. by national..." text
  ctx4.fillStyle = '#fffaec';
  ctx4.fillRect(298, 35, 85, 80);

  // Composite official IHREO logo
  ctx4.drawImage(officialLogo, 298, 35, 84, 84);

  // Clean pre-printed "Wild Life Expert" (x: 305 to 420, y: 828 to 852)
  ctx4.fillStyle = '#fffaec';
  ctx4.fillRect(305, 828, 115, 24);

  // Signatures
  drawSignature(ctx4, 'founder', 125, 865, '#0f2942');
  drawSignature(ctx4, 'co-founder', 475, 865, '#0f2942');

  await saveTemplateFiles(c4, 'Bhartiye Gaurav Ratan Samman');
  await saveTemplateFiles(c4, 'Bhartiye Ashok Samman');

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Women Icon Award (media_1788854868669.jpg) - 682x1024
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n5. Processing Women Icon Award...');
  const img5 = await loadImage(path.join(uploadedDir, 'media_1788854868669.jpg'));
  const c5 = createCanvas(img5.width, img5.height);
  const ctx5 = c5.getContext('2d');
  ctx5.drawImage(img5, 0, 0);

  // Center circular inpainting over old logo inside wreath
  ctx5.beginPath();
  ctx5.arc(341, 305, 54, 0, Math.PI * 2);
  ctx5.fillStyle = '#f2ead3';
  ctx5.fill();

  // Composite official IHREO logo
  ctx5.drawImage(officialLogo, 297, 261, 88, 88);

  // Signatures
  drawSignature(ctx5, 'founder', 115, 865, '#0f2942');
  drawSignature(ctx5, 'co-founder', 485, 865, '#0f2942');

  await saveTemplateFiles(c5, 'women icon award');

  console.log('\n=== ALL 5 NEW TEMPLATES PROCESSED & SAVED WITH FLAWLESS INPAINTING! ===');
}

processTemplates().catch((err) => {
  console.error('Process failed:', err);
  process.exit(1);
});
