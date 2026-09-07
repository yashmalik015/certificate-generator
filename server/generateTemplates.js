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
// 1. Bhartiye Ashok Samman
// ─────────────────────────────────────────────────────────────────────────────
async function generateAshokSamman() {
  const imgPath = path.join(userDir, 'media_1788675039736.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Clean Top Left Ref area & Top Right QR area
  cleanCornerBox(ctx, 50, 55, 290, 150, 298);
  cleanCornerBox(ctx, 510, 55, 635, 160, 500);

  // Photo frame
  ctx.save();
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(280, 563, 122, 137);
  ctx.strokeStyle = '#cda250';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(279, 562, 124, 139);
  ctx.strokeStyle = '#e6c875';
  ctx.lineWidth = 1;
  ctx.strokeRect(281, 564, 120, 135);
  ctx.restore();

  // Clean body text
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
// 2. Best Business Icon Award (New Pristine Template)
// ─────────────────────────────────────────────────────────────────────────────
async function generateBestBusinessIcon() {
  const candidatePaths = [
    path.join(userDir, 'media_1788715936375.jpg'),
    path.join(userDir, 'media_1788681904663.jpg')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const cx = Math.round(img.width / 2); // 357
  const cy = 502;
  const r = 105;

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
      x: 575,
      y: 80,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'Best Business Icon Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bhartiya Padma Bhushan Samman (New Pristine Template)
// ─────────────────────────────────────────────────────────────────────────────
async function generatePadmaBhushan() {
  const candidatePaths = [
    path.join(userDir, 'media_1788715936386.jpg'),
    path.join(userDir, 'media_1788675039758.jpg')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Clean ribbon text with 3D metallic gold gradient
  const ribbonGrad = ctx.createLinearGradient(250, 420, 470, 440);
  ribbonGrad.addColorStop(0, '#cda250');
  ribbonGrad.addColorStop(0.2, '#dfbc6e');
  ribbonGrad.addColorStop(0.5, '#f5e4ab');
  ribbonGrad.addColorStop(0.8, '#dfbc6e');
  ribbonGrad.addColorStop(1, '#cda250');

  ctx.save();
  ctx.beginPath();
  ctx.rect(265, 415, 192, 28);
  ctx.fillStyle = ribbonGrad;
  ctx.fill();
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiya Padma Bhushan Samman');
  await saveCanvasAsPngAndPdf(canvas, 'rashtriya padma bhushan samman');

  const config = {
    id: 'Bhartiya Padma Bhushan Samman',
    alias: 'rashtriya padma bhushan samman',
    title: 'Bhartiya Padma Bhushan Samman',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    photo: {
      type: 'circle',
      centerX: 362,
      centerY: 340,
      radius: 71,
      borderColor: '#c49a45',
      borderWidth: 2.5
    },
    qrCode: {
      x: 558,
      y: 90,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiya Padma Bhushan Samman.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(configDir, 'rashtriya padma bhushan samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bhartiye Gaurav Ratan Samman (New Pristine Blank Template)
// ─────────────────────────────────────────────────────────────────────────────
async function generateGauravRatan() {
  const candidatePaths = [
    path.join(userDir, 'media_1788715936394.jpg'),
    path.join(userDir, 'media_1788682520265.jpg')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const px = 255, py = 560, pw = 172, ph = 196, radius = 10;

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
      x: 535,
      y: 75,
      size: 72
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiye Gaurav Ratan Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Arya Bhushan Samaj Seva Award / Bhartiya Samaj Seva award (New Pristine Template)
// ─────────────────────────────────────────────────────────────────────────────
async function generateSamajSeva() {
  const imgPath = path.join(userDir, 'media_1788715936370.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiya Samaj Seva award');
  await saveCanvasAsPngAndPdf(canvas, 'Arya Bhushan Samaj Seva Award');

  const config = {
    id: 'Bhartiya Samaj Seva award',
    alias: 'Arya Bhushan Samaj Seva Award',
    title: 'Arya Bhushan Samaj Seva Award',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    nameLine: {
      x: 417,
      y: 540,
      width: 400
    },
    dateLine: {
      x: 460,
      y: 860
    },
    qrCode: {
      x: 575,
      y: 85,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiya Samaj Seva award.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(configDir, 'Arya Bhushan Samaj Seva Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Women Icon Award (New Pristine Template)
// ─────────────────────────────────────────────────────────────────────────────
async function generateWomenIcon() {
  const imgPath = path.join(userDir, 'media_1788715936403.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const cx = Math.round(img.width / 2); // 341
  const cy = 460;
  const r = 85;

  await saveCanvasAsPngAndPdf(canvas, 'women icon award');
  await saveCanvasAsPngAndPdf(canvas, 'Women Icon Award');

  const config = {
    id: 'women icon award',
    alias: 'Women Icon Award',
    title: 'Women Icon Award',
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
    nameLine: {
      x: cx,
      y: 730
    },
    dateLine: {
      x: 420,
      y: 824
    },
    qrCode: {
      x: 545,
      y: 75,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'women icon award.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(configDir, 'Women Icon Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. International Business Excellence Award
// ─────────────────────────────────────────────────────────────────────────────
async function generateInternationalBusinessExcellence() {
  const candidatePaths = [
    path.join(userDir, 'media_1788675039747.jpg'),
    path.join(userDir, 'media_1788682950639.png')
  ];
  const imgPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const cW = canvas.width;
  const imgData = ctx.getImageData(0, 0, cW, canvas.height);
  const data = imgData.data;

  function getPixel(x, y) {
    const idx = (y * cW + x) * 4;
    return [data[idx], data[idx+1], data[idx+2]];
  }
  function setPixel(x, y, rgb) {
    const idx = (y * cW + x) * 4;
    data[idx] = rgb[0]; data[idx+1] = rgb[1]; data[idx+2] = rgb[2];
  }

  // 1. Clean Top Left Ref area (from x=60 to x=290, y=80 to y=165)
  for (let y = 80; y <= 165; y++) {
    const src = getPixel(300, y);
    for (let x = 60; x <= 290; x++) {
      setPixel(x, y, src);
    }
  }

  // 2. Clean Top Right QR area (from x=565 to x=646, y=80 to y=165)
  for (let y = 80; y <= 165; y++) {
    const src = getPixel(560, y);
    for (let x = 565; x <= 646; x++) {
      setPixel(x, y, src);
    }
  }

  // 3. Clean Name area using vertical interpolation between y=522 and y=551
  for (let x = 218; x <= 610; x++) {
    const topColor = getPixel(x, 522);
    const bottomColor = getPixel(x, 551);
    for (let y = 523; y <= 550; y++) {
      const t = (y - 522) / (551 - 522);
      setPixel(x, y, [
        Math.round(topColor[0] * (1 - t) + bottomColor[0] * t),
        Math.round(topColor[1] * (1 - t) + bottomColor[1] * t),
        Math.round(topColor[2] * (1 - t) + bottomColor[2] * t)
      ]);
    }
  }

  // 4. Clean Date of Issue completely: x=280..460, y=840..872
  for (let y = 840; y <= 872; y++) {
    const leftColor = getPixel(275, y);
    const rightColor = getPixel(465, y);
    for (let x = 280; x <= 460; x++) {
      const t = (x - 275) / (465 - 275);
      setPixel(x, y, [
        Math.round(leftColor[0] * (1 - t) + rightColor[0] * t),
        Math.round(leftColor[1] * (1 - t) + rightColor[1] * t),
        Math.round(leftColor[2] * (1 - t) + rightColor[2] * t)
      ]);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 5. Clean photo slot with pristine light gray background & gray border
  const px = 312, py = 356, pw = 110, ph = 130, radius = 6;
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, radius);
  else ctx.rect(px, py, pw, ph);
  ctx.closePath();
  ctx.fillStyle = '#edf2f7';
  ctx.fill();
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 6. Re-draw crisp golden-brown underline from x=218 to x=610 at y=555
  ctx.save();
  ctx.strokeStyle = '#8b6f52';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(218, 555);
  ctx.lineTo(610, 555);
  ctx.stroke();
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'INTERNATIONAL BUSINESS EXCELLENCE AWARD');

  const config = {
    id: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD',
    title: 'International Business Excellence Award',
    category: 'Business & Excellence',
    width: img.width,
    height: img.height,
    photo: {
      type: 'rect',
      x: px,
      y: py,
      width: pw,
      height: ph,
      radius: radius,
      borderColor: '#444444',
      borderWidth: 1.5
    },
    qrCode: {
      x: 575,
      y: 87,
      size: 70
    }
  };

  fs.writeFileSync(path.join(configDir, 'INTERNATIONAL BUSINESS EXCELLENCE AWARD.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all generators
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('--- Generating 100% Reference-Matched Blank Certificate Templates ---');
  await generateAshokSamman();
  await generateBestBusinessIcon();
  await generatePadmaBhushan();
  await generateGauravRatan();
  await generateSamajSeva();
  await generateWomenIcon();
  await generateInternationalBusinessExcellence();
  console.log('=== All Blank Certificate Templates Successfully Reconstructed! ===');
}

main().catch((err) => {
  console.error('Fatal Template Generation Error:', err);
  process.exit(1);
});
