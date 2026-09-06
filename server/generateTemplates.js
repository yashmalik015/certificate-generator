import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDir = '/Users/yashmalik/.gemini/antigravity-ide/brain/dc6e698a-089a-4c07-aeef-c884d732a6cb/.user_uploaded';
const targetDir = path.resolve(__dirname, '../src/assets/certificate-templates');
const assetsDir = path.resolve(__dirname, '../src/assets');
const publicDir1 = path.resolve(__dirname, '../public/assets/certificate-templates');
const publicDir2 = path.resolve(__dirname, '../public/certificate-templates');
const configDir = path.join(targetDir, 'config');

[targetDir, assetsDir, publicDir1, publicDir2, configDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/**
 * Clean a rectangular zone on the canvas by horizontally interpolating
 * from clean left and right background margins at every Y line.
 * This completely erases old ghost text, old dates, and sample names
 * while preserving the natural vertical parchment gradients.
 */
function cleanHorizontalZone(ctx, startY, endY, leftCleanX, rightCleanX, startCleanX, endCleanX) {
  const cW = ctx.canvas.width;
  const imgData = ctx.getImageData(0, 0, cW, ctx.canvas.height);
  const data = imgData.data;

  function getPixel(x, y) {
    x = Math.max(0, Math.min(cW - 1, Math.round(x)));
    y = Math.max(0, Math.min(ctx.canvas.height - 1, Math.round(y)));
    const idx = (y * cW + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  function setPixel(x, y, rgb) {
    const idx = (y * cW + x) * 4;
    data[idx] = rgb[0];
    data[idx + 1] = rgb[1];
    data[idx + 2] = rgb[2];
  }

  for (let y = startY; y <= endY; y++) {
    let leftColor = [0, 0, 0], rightColor = [0, 0, 0];
    for (let d = -2; d <= 2; d++) {
      const l = getPixel(leftCleanX + d, y);
      const r = getPixel(rightCleanX + d, y);
      for (let c = 0; c < 3; c++) {
        leftColor[c] += l[c] / 5;
        rightColor[c] += r[c] / 5;
      }
    }

    for (let x = startCleanX; x <= endCleanX; x++) {
      const t = (x - leftCleanX) / Math.max(1, (rightCleanX - leftCleanX));
      const interpolated = [
        Math.round(leftColor[0] * (1 - t) + rightColor[0] * t),
        Math.round(leftColor[1] * (1 - t) + rightColor[1] * t),
        Math.round(leftColor[2] * (1 - t) + rightColor[2] * t)
      ];
      setPixel(x, y, interpolated);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Clean a top corner box (QR or Ref info) by copying adjacent clean parchment background.
 */
function cleanCornerBox(ctx, x1, y1, x2, y2, sourceX) {
  const cW = ctx.canvas.width;
  const imgData = ctx.getImageData(0, 0, cW, ctx.canvas.height);
  const data = imgData.data;

  for (let y = y1; y <= y2; y++) {
    const idxSrc = (y * cW + sourceX) * 4;
    const r = data[idxSrc], g = data[idxSrc + 1], b = data[idxSrc + 2];
    for (let x = x1; x <= x2; x++) {
      const idx = (y * cW + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// Save clean PNG and PDF into all required paths
async function saveCanvasAsPngAndPdf(canvas, baseName) {
  const pngBuf = canvas.toBuffer('image/png');

  fs.writeFileSync(path.join(targetDir, `${baseName}.png`), pngBuf);
  fs.writeFileSync(path.join(assetsDir, `${baseName}.png`), pngBuf);
  fs.writeFileSync(path.join(publicDir1, `${baseName}.png`), pngBuf);
  fs.writeFileSync(path.join(publicDir2, `${baseName}.png`), pngBuf);

  // Create PDF wrapping this high-res pristine blank template
  const pdfDoc = await PDFDocument.create();
  const imgEmbed = await pdfDoc.embedPng(pngBuf);
  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  page.drawImage(imgEmbed, {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  });
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(path.join(targetDir, `${baseName}.pdf`), pdfBytes);
  fs.writeFileSync(path.join(assetsDir, `${baseName}.pdf`), pdfBytes);
  console.log(`✓ Saved pristine blank template: ${baseName} (${canvas.width}x${canvas.height})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bhartiye Ashok Samman (Flawless Reference Matching)
// ─────────────────────────────────────────────────────────────────────────────
async function generateAshokSamman() {
  const imgPath = path.join(userDir, 'media_1788675039736.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Left Ref area (from x=50 to x=290, y=55 to y=150) - Removes stray "3" and old CIN/SL!
  cleanCornerBox(ctx, 50, 55, 290, 150, 298);

  // 2. Clean Top Right QR area (from x=510 to x=635, y=55 to y=160) - Removes old QR and edge lines near G20
  cleanCornerBox(ctx, 510, 55, 635, 160, 500);

  // 3. Clean inside photo frame with neutral parchment & draw pristine double gold frame
  ctx.save();
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(280, 563, 122, 137);

  // Outer gold frame
  ctx.strokeStyle = '#cda250';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(279, 562, 124, 139);

  // Inner subtle border
  ctx.strokeStyle = '#e6c875';
  ctx.lineWidth = 1;
  ctx.strokeRect(281, 564, 120, 135);
  ctx.restore();

  // 4. Clean ALL text from y=696 down to y=855 across x=115..565!
  // This completely eliminates:
  // - "Dr. Jojo Koruth James"
  // - "And is honored with the title"
  // - "Bhartiye Ashok Samman"
  // - old citation lines
  // - old "Date of Issue : 26-12-2025"
  cleanHorizontalZone(ctx, 696, 855, 115, 565, 120, 560);

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiye Ashok Samman');

  const config = {
    id: 'Bhartiye Ashok Samman',
    title: 'Bhartiye Ashok Samman',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    photo: {
      type: 'rect',
      x: 282,
      y: 565,
      width: 118,
      height: 133,
      radius: 4,
      borderColor: '#cda250',
      borderWidth: 2
    },
    qrCode: {
      x: 535,
      y: 72,
      size: 72
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiye Ashok Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. International Business Excellence Award
// ─────────────────────────────────────────────────────────────────────────────
async function generateInternationalBusinessExcellence() {
  const imgPath = path.join(userDir, 'media_1788675039747.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Left Ref area
  cleanCornerBox(ctx, 75, 60, 290, 155, 300);

  // 2. Clean Top Right QR area
  cleanCornerBox(ctx, 565, 60, 670, 165, 555);

  // 3. Clean inside photo frame
  ctx.save();
  ctx.fillStyle = '#eef3f7';
  ctx.fillRect(312, 362, 110, 120);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(311.5, 361.5, 111, 121);
  ctx.restore();

  // 4. Clean Recipient Name on underline (y=498..540, x=220..610)
  cleanHorizontalZone(ctx, 498, 540, 150, 650, 220, 610);

  // 5. Re-render crisp golden-brown underline
  ctx.save();
  ctx.strokeStyle = '#8b6f52';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(225, 542);
  ctx.lineTo(608, 542);
  ctx.stroke();
  ctx.restore();

  // 6. Clean Date of Issue area (y=830..865, x=270..540)
  cleanHorizontalZone(ctx, 830, 865, 180, 580, 270, 540);

  await saveCanvasAsPngAndPdf(canvas, 'INTERNATIONAL BUSINESS EXCELLENCE AWARD');

  const config = {
    id: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD',
    title: 'International Business Excellence Award',
    category: 'Business & Excellence',
    width: img.width,
    height: img.height,
    photo: {
      type: 'rect',
      x: 312,
      y: 362,
      width: 110,
      height: 120,
      radius: 6,
      borderColor: '#333333',
      borderWidth: 1.5
    },
    qrCode: {
      x: 580,
      y: 80,
      size: 72
    }
  };

  fs.writeFileSync(path.join(configDir, 'INTERNATIONAL BUSINESS EXCELLENCE AWARD.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bhartiya Padma Bhushan Samman
// ─────────────────────────────────────────────────────────────────────────────
async function generatePadmaBhushan() {
  const imgPath = path.join(userDir, 'media_1788675039758.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Right QR area
  cleanCornerBox(ctx, 540, 70, 655, 175, 530);

  // 2. Clean inside circular laurel frame
  ctx.save();
  ctx.beginPath();
  ctx.arc(361, 340, 71, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(280, 260, 160, 160);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // 3. Re-render 3D metallic golden ribbon banner across bottom of circle
  const ribbonGrad = ctx.createLinearGradient(250, 420, 470, 440);
  ribbonGrad.addColorStop(0, '#cda250');
  ribbonGrad.addColorStop(0.2, '#dfbc6e');
  ribbonGrad.addColorStop(0.5, '#f5e4ab');
  ribbonGrad.addColorStop(0.8, '#dfbc6e');
  ribbonGrad.addColorStop(1, '#cda250');

  ctx.save();
  ctx.beginPath();
  ctx.rect(265, 415, 192, 28);
  ctx.closePath();
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(265, 415, 192, 28);
  ctx.restore();

  // 4. Clean Body Citation, Name, and Date zones (y=518..735)
  cleanHorizontalZone(ctx, 518, 735, 115, 605, 130, 590);

  // 5. Re-render crisp static boilerplate in body
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222222';
  ctx.font = '14px "Times New Roman", serif';
  ctx.fillText('In recognition of outstanding', 361, 574);
  ctx.fillText('contributions and dedication in the field of', 361, 592);
  ctx.fillText('this award of honour and recognition is presented to', 361, 638);
  ctx.fillText('for betterment of society', 361, 706);
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'rashtriya padma bhushan samman');
  await saveCanvasAsPngAndPdf(canvas, 'Bhartiya Padma Bhushan Samman');

  const config = {
    id: 'rashtriya padma bhushan samman',
    alias: 'Bhartiya Padma Bhushan Samman',
    title: 'Bhartiya Padma Bhushan Samman',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    photo: {
      type: 'circle',
      centerX: 361,
      centerY: 340,
      radius: 70,
      borderColor: '#c49a45',
      borderWidth: 2.5
    },
    qrCode: {
      x: 558,
      y: 90,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'rashtriya padma bhushan samman.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(configDir, 'Bhartiya Padma Bhushan Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bhartiye Gaurav Ratan Samman
// ─────────────────────────────────────────────────────────────────────────────
async function generateGauravRatan() {
  const candidatePaths = [
    path.join(userDir, 'media_1788682520265.jpg'),
    path.join(userDir, 'media_1788675039781.jpg')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const cW = canvas.width;
  const imgData = ctx.getImageData(0, 0, cW, canvas.height);
  const data = imgData.data;

  // 1. Clean Top Left Ref area (from x=50 to x=285, y=95 to y=175)
  for (let y = 95; y <= 175; y++) {
    const srcIdx = (y * cW + 295) * 4;
    const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2];
    for (let x = 50; x <= 285; x++) {
      const idx = (y * cW + x) * 4;
      data[idx] = r; data[idx+1] = g; data[idx+2] = b;
    }
  }

  // 2. Clean Top Right QR area (from x=515 to x=610, y=95 to y=175)
  for (let y = 95; y <= 175; y++) {
    const srcIdx = (y * cW + 508) * 4;
    const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2];
    for (let x = 515; x <= 610; x++) {
      const idx = (y * cW + x) * 4;
      data[idx] = r; data[idx+1] = g; data[idx+2] = b;
    }
  }

  // 3. Clean Text below Photo: y=760 to y=915, x=120..562
  for (let y = 760; y <= 915; y++) {
    const leftIdx = (y * cW + 115) * 4;
    const rightIdx = (y * cW + 567) * 4;
    const lr = data[leftIdx], lg = data[leftIdx+1], lb = data[leftIdx+2];
    const rr = data[rightIdx], rg = data[rightIdx+1], rb = data[rightIdx+2];

    for (let x = 120; x <= 562; x++) {
      const t = (x - 115) / (567 - 115);
      const idx = (y * cW + x) * 4;
      data[idx] = Math.round(lr * (1 - t) + rr * t);
      data[idx+1] = Math.round(lg * (1 - t) + rg * t);
      data[idx+2] = Math.round(lb * (1 - t) + rb * t);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. Clean inside Photo Frame with rounded rectangle & crisp gold border
  const px = 255, py = 560, pw = 172, ph = 196, radius = 10;
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px, py, pw, ph, radius);
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.closePath();
  ctx.fillStyle = '#fcf9f2';
  ctx.fill();

  // Draw elegant gold outer border
  ctx.strokeStyle = '#cda250';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Subtle inner border
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px + 2, py + 2, pw - 4, ph - 4, radius - 2);
  } else {
    ctx.rect(px + 2, py + 2, pw - 4, ph - 4);
  }
  ctx.strokeStyle = '#e8d18a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiye Gaurav Ratan Samman');

  const config = {
    id: 'Bhartiye Gaurav Ratan Samman',
    title: 'Bhartiye Gaurav Ratan Samman',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    photo: {
      type: 'rect',
      x: px,
      y: py,
      width: pw,
      height: ph,
      radius: radius,
      borderColor: '#cda250',
      borderWidth: 2.5
    },
    qrCode: {
      x: 525,
      y: 100,
      size: 72
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiye Gaurav Ratan Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Best Business Icon Award
// ─────────────────────────────────────────────────────────────────────────────
async function generateBestBusinessIcon() {
  const candidatePaths = [
    path.join(userDir, 'media_1788681904663.jpg'),
    path.join(userDir, 'media_1788675039947.jpg')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Left Ref area (from x=45 to x=280, y=65 to y=165)
  cleanCornerBox(ctx, 45, 65, 280, 165, 285);

  // 2. Clean Top Right QR area (from x=540 to x=660, y=65 to y=165)
  cleanCornerBox(ctx, 540, 65, 660, 165, 535);

  // 3. Clean inside circular golden laurel frame
  const cx = Math.round(img.width / 2); // 348 for 696w, 356 for 713w
  const cy = 500;
  const r = 101;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f6f8fb';
  ctx.fillRect(cx - r - 5, cy - r - 5, (r + 5) * 2, (r + 5) * 2);
  ctx.restore();

  // Draw delicate gold inner circle rim
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Navy Blue 3D Ribbon Banner text using smooth silk gradient
  const ribGrad = ctx.createLinearGradient(170, 0, 526, 0);
  ribGrad.addColorStop(0, '#0a215a');
  ribGrad.addColorStop(0.15, '#12307d');
  ribGrad.addColorStop(0.5, '#1e439e');
  ribGrad.addColorStop(0.85, '#12307d');
  ribGrad.addColorStop(1, '#0a215a');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(175, 600);
  ctx.lineTo(521, 600);
  ctx.lineTo(521, 658);
  ctx.lineTo(175, 658);
  ctx.closePath();
  ctx.fillStyle = ribGrad;
  ctx.fill();

  // Draw gold border on top and bottom edge of ribbon
  ctx.strokeStyle = '#e0be6c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(175, 600);
  ctx.lineTo(521, 600);
  ctx.moveTo(175, 658);
  ctx.lineTo(521, 658);
  ctx.stroke();
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'Best Business Icon Award');

  const config = {
    id: 'Best Business Icon Award',
    title: 'Best Business Icon Award',
    category: 'Business & Excellence',
    width: img.width,
    height: img.height,
    photo: {
      type: 'circle',
      centerX: cx,
      centerY: cy,
      radius: r,
      borderColor: '#c49a45',
      borderWidth: 2.5
    },
    qrCode: {
      x: 560,
      y: 80,
      size: 72
    }
  };

  fs.writeFileSync(path.join(configDir, 'Best Business Icon Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all generators
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('--- Generating 100% Reference-Matched Blank Certificate Templates ---');
  await generateAshokSamman();
  await generateInternationalBusinessExcellence();
  await generatePadmaBhushan();
  await generateGauravRatan();
  await generateBestBusinessIcon();
  console.log('=== All 5 Blank Certificate Templates Successfully Reconstructed! ===');
}

main().catch((err) => {
  console.error('Fatal Template Generation Error:', err);
  process.exit(1);
});
