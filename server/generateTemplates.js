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

  // 1. Clean Top Left Ref area
  cleanCornerBox(ctx, 65, 65, 265, 142, 275);

  // 2. Clean Top Right QR area
  cleanCornerBox(ctx, 525, 65, 625, 155, 515);

  // 3. Clean inside photo frame with neutral parchment
  ctx.save();
  ctx.fillStyle = '#f8f4e6';
  ctx.fillRect(281, 564, 120, 135);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(280.5, 563.5, 121, 136);
  ctx.restore();

  // 4. Clean Recipient Name zone (y=704..740)
  cleanHorizontalZone(ctx, 704, 740, 115, 565, 130, 550);

  // 5. Clean Citation & Date of Issue zone (y=760..855)
  // This removes all old ghost citation text AND old "Date of Issue : 26-12-2025" completely!
  cleanHorizontalZone(ctx, 760, 855, 115, 565, 115, 565);

  // 6. Re-render crisp static subtitle "And is honored with the title"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '15px "Times New Roman", serif';
  ctx.fillStyle = '#222222';
  ctx.fillText('And is honored with the title', 341, 752);
  ctx.restore();

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiye Ashok Samman');

  const config = {
    id: 'Bhartiye Ashok Samman',
    title: 'Bhartiye Ashok Samman',
    category: 'National Honors',
    width: img.width,
    height: img.height,
    photo: {
      type: 'rect',
      x: 280,
      y: 563,
      width: 122,
      height: 137,
      radius: 6,
      borderColor: '#333333',
      borderWidth: 1.5
    },
    qrCode: {
      x: 535,
      y: 72,
      size: 72
    },
    fields: {
      refText: {
        x: 72,
        y: 84,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'bold',
        align: 'left'
      },
      fullName: {
        x: 341,
        y: 726,
        fontSize: 22,
        font: 'bold',
        color: '#111827',
        align: 'center',
        maxWidth: 380
      },
      category: {
        x: 341,
        y: 796,
        fontSize: 11.5,
        font: 'normal',
        color: '#222222',
        align: 'center',
        maxWidth: 440,
        wrap: true,
        lineHeight: 16
      },
      letterIssuedAt: {
        x: 341,
        y: 838,
        fontSize: 11,
        font: 'normal',
        color: '#1a1a1a',
        align: 'center',
        prefix: 'Date of Issue : '
      }
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
  cleanCornerBox(ctx, 80, 70, 280, 150, 290);

  // 2. Clean Top Right QR area
  cleanCornerBox(ctx, 570, 70, 665, 160, 560);

  // 3. Clean inside photo frame
  ctx.save();
  ctx.fillStyle = '#e8eff5';
  ctx.fillRect(313, 363, 108, 118);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.strokeRect(312, 362, 110, 120);
  ctx.restore();

  // 4. Clean Recipient Name on underline
  cleanHorizontalZone(ctx, 502, 540, 150, 650, 220, 610);

  // 5. Re-render crisp golden-brown underline
  ctx.save();
  ctx.strokeStyle = '#8b6f52';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(225, 542);
  ctx.lineTo(608, 542);
  ctx.stroke();
  ctx.restore();

  // 6. Clean Date of Issue area (y=830..865)
  cleanHorizontalZone(ctx, 830, 865, 180, 580, 280, 530);

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
      radius: 8,
      borderColor: '#333333',
      borderWidth: 1.5
    },
    qrCode: {
      x: 580,
      y: 80,
      size: 72
    },
    fields: {
      refText: {
        x: 88,
        y: 95,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'bold',
        align: 'left'
      },
      fullName: {
        x: 416,
        y: 534,
        fontSize: 23,
        font: 'italic bold',
        color: '#2b1b17',
        align: 'center',
        maxWidth: 360
      },
      letterIssuedAt: {
        x: 367,
        y: 849,
        fontSize: 11,
        font: 'normal',
        color: '#1a1a1a',
        align: 'center',
        prefix: 'Date of Issue : '
      }
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
  cleanCornerBox(ctx, 545, 80, 645, 170, 535);

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
  // This completely removes all old ghost text, double names, and double dates!
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
      radius: 72,
      borderColor: '#c49a45',
      borderWidth: 2.5
    },
    qrCode: {
      x: 558,
      y: 90,
      size: 70
    },
    fields: {
      ribbonName: {
        x: 361,
        y: 434,
        fontSize: 14,
        font: 'bold',
        color: '#2a1a08',
        align: 'center',
        maxWidth: 180
      },
      category: {
        x: 361,
        y: 610,
        fontSize: 14,
        font: 'bold',
        color: '#b45309',
        align: 'center'
      },
      fullName: {
        x: 361,
        y: 676,
        fontSize: 26,
        font: 'bold',
        color: '#111827',
        align: 'center',
        maxWidth: 420
      },
      letterIssuedAt: {
        x: 361,
        y: 728,
        fontSize: 13,
        font: 'bold',
        color: '#1a1a1a',
        align: 'center'
      }
    }
  };

  fs.writeFileSync(path.join(configDir, 'rashtriya padma bhushan samman.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(configDir, 'Bhartiya Padma Bhushan Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bhartiye Gaurav Ratan Samman
// ─────────────────────────────────────────────────────────────────────────────
async function generateGauravRatan() {
  const imgPath = path.join(userDir, 'media_1788675039781.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Left Ref area
  cleanCornerBox(ctx, 65, 90, 265, 165, 275);

  // 2. Clean Top Right QR area
  cleanCornerBox(ctx, 525, 90, 625, 180, 515);

  // 3. Clean inside photo frame
  ctx.save();
  ctx.fillStyle = '#f8f4e6';
  ctx.fillRect(256, 549, 170, 188);
  ctx.strokeStyle = '#2d5a27';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(255.5, 548.5, 171, 189);
  ctx.restore();

  // 4. Clean Recipient Name zone (y=740..780)
  cleanHorizontalZone(ctx, 740, 780, 115, 565, 130, 550);

  // 5. Clean Citation & Date zone (y=805..895)
  cleanHorizontalZone(ctx, 805, 895, 115, 565, 115, 565);

  // 6. Re-render crisp static subtitle
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '15px "Times New Roman", serif';
  ctx.fillStyle = '#222222';
  ctx.fillText('And is honored with the title', 341, 794);
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
      x: 255,
      y: 548,
      width: 172,
      height: 190,
      radius: 8,
      borderColor: '#2d5a27',
      borderWidth: 1.5
    },
    qrCode: {
      x: 535,
      y: 95,
      size: 72
    },
    fields: {
      refText: {
        x: 72,
        y: 110,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'bold',
        align: 'left'
      },
      fullName: {
        x: 341,
        y: 765,
        fontSize: 24,
        font: 'bold',
        color: '#111827',
        align: 'center',
        maxWidth: 380
      },
      category: {
        x: 341,
        y: 842,
        fontSize: 11.5,
        font: 'normal',
        color: '#222222',
        align: 'center',
        maxWidth: 440,
        wrap: true,
        lineHeight: 16
      },
      letterIssuedAt: {
        x: 341,
        y: 882,
        fontSize: 11,
        font: 'normal',
        color: '#1a1a1a',
        align: 'center',
        prefix: 'Date of Issue : '
      }
    }
  };

  fs.writeFileSync(path.join(configDir, 'Bhartiye Gaurav Ratan Samman.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Best Business Icon Award
// ─────────────────────────────────────────────────────────────────────────────
async function generateBestBusinessIcon() {
  const imgPath = path.join(userDir, 'media_1788675039947.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean Top Left Ref area
  cleanCornerBox(ctx, 65, 70, 265, 155, 275);

  // 2. Clean Top Right QR area
  cleanCornerBox(ctx, 550, 70, 650, 160, 540);

  // 3. Clean inside circular golden laurel frame
  ctx.save();
  ctx.beginPath();
  ctx.arc(356, 490, 107, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(240, 370, 240, 240);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Navy Blue 3D Ribbon Banner text using smooth silk gradient
  const ribbonGrad = ctx.createLinearGradient(180, 600, 530, 640);
  ribbonGrad.addColorStop(0, '#0c2461');
  ribbonGrad.addColorStop(0.2, '#183184');
  ribbonGrad.addColorStop(0.5, '#2243a8');
  ribbonGrad.addColorStop(0.8, '#183184');
  ribbonGrad.addColorStop(1, '#0c2461');

  ctx.save();
  ctx.beginPath();
  ctx.rect(195, 595, 322, 48);
  ctx.closePath();
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(195, 595, 322, 48);
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
      centerX: 356,
      centerY: 490,
      radius: 108,
      borderColor: '#c49a45',
      borderWidth: 3
    },
    qrCode: {
      x: 560,
      y: 80,
      size: 72
    },
    fields: {
      refText: {
        x: 68,
        y: 96,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'bold',
        align: 'left'
      },
      fullName: {
        x: 356,
        y: 628,
        fontSize: 24,
        font: 'bold',
        color: '#f6e58d',
        align: 'center',
        maxWidth: 310
      }
    }
  };

  fs.writeFileSync(path.join(configDir, 'Best Business Icon Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all generators
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('--- Generating 100% Spotless Blank Certificate Templates ---');
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
