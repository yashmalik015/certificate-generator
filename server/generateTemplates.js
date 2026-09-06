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
const configDir = path.join(targetDir, 'config');

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

// Helper: patch image region
function fillRectSmooth(ctx, x, y, w, h, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Convert canvas to PDF and PNG files
async function saveCanvasAsPngAndPdf(canvas, baseName) {
  const pngBuf = canvas.toBuffer('image/png');

  // Save PNG in targetDir and assetsDir
  fs.writeFileSync(path.join(targetDir, `${baseName}.png`), pngBuf);
  fs.writeFileSync(path.join(assetsDir, `${baseName}.png`), pngBuf);

  // Create PDF wrapping this high-res image
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
  console.log(`Saved template PNG and PDF for: ${baseName} (${canvas.width}x${canvas.height})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bhartiye Ashok Samman (Gold Ornate Border, Ashok Stambh)
// ─────────────────────────────────────────────────────────────────────────────
async function generateAshokSamman() {
  const imgPath = path.join(userDir, 'media_1788675039736.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean QR Code box (Top Right)
  fillRectSmooth(ctx, 532, 70, 85, 82, '#fcfaf2');

  // 2. Clean Top Left Sl No
  fillRectSmooth(ctx, 70, 70, 205, 65, '#fcfaf2');

  // 3. Clean Photo inside rounded border
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(280, 563, 122, 137, 6);
  } else {
    ctx.rect(280, 563, 122, 137);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f8f4e6';
  ctx.fillRect(280, 563, 122, 137);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Recipient Name
  fillRectSmooth(ctx, 160, 704, 360, 32, '#fcf9ee');

  // 5. Clean Category & Citation details
  fillRectSmooth(ctx, 120, 780, 442, 45, '#fcf9ee');

  // 6. Clean Date of Issue
  fillRectSmooth(ctx, 335, 825, 120, 22, '#fcf9ee');

  await saveCanvasAsPngAndPdf(canvas, 'Bhartiye Ashok Samman');

  // Write config JSON
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
      borderWidth: 2
    },
    qrCode: {
      x: 540,
      y: 74,
      size: 72
    },
    fields: {
      refText: {
        x: 74,
        y: 84,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'normal',
        align: 'left'
      },
      fullName: {
        x: 341,
        y: 727,
        fontSize: 22,
        font: 'bold',
        color: '#1a1a1a',
        align: 'center',
        maxWidth: 380
      },
      category: {
        x: 341,
        y: 796,
        fontSize: 12,
        font: 'normal',
        color: '#2a2a2a',
        align: 'center',
        maxWidth: 440,
        wrap: true,
        lineHeight: 16
      },
      letterIssuedAt: {
        x: 341,
        y: 838,
        fontSize: 12,
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
// 2. International Business Excellence Award (Red/Brown Vintage Border, Globe)
// ─────────────────────────────────────────────────────────────────────────────
async function generateInternationalBusinessExcellence() {
  const imgPath = path.join(userDir, 'media_1788675039747.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean QR Code box
  fillRectSmooth(ctx, 580, 80, 85, 82, '#fcfaf5');

  // 2. Clean Top Left Ref info
  fillRectSmooth(ctx, 90, 80, 205, 68, '#fcfaf5');

  // 3. Clean Photo inside rounded border
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(312, 362, 110, 120, 8);
  } else {
    ctx.rect(312, 362, 110, 120);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#e8eff5';
  ctx.fillRect(312, 362, 110, 120);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Recipient Name on underline (preserve the underline!)
  fillRectSmooth(ctx, 230, 508, 380, 32, '#faf9f5');
  // Redraw clean underline
  ctx.save();
  ctx.strokeStyle = '#8b6f52';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(225, 542);
  ctx.lineTo(608, 542);
  ctx.stroke();
  ctx.restore();

  // 5. Clean Date of Issue
  fillRectSmooth(ctx, 385, 835, 120, 24, '#faf9f5');

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
      borderWidth: 2
    },
    qrCode: {
      x: 588,
      y: 84,
      size: 72
    },
    fields: {
      refText: {
        x: 94,
        y: 95,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'normal',
        align: 'left'
      },
      fullName: {
        x: 416,
        y: 534,
        fontSize: 24,
        font: 'italic bold',
        color: '#2b1b17',
        align: 'center',
        maxWidth: 360
      },
      letterIssuedAt: {
        x: 367,
        y: 849,
        fontSize: 12,
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
// 3. Bhartiya Padma Bhushan Samman (Navy/Gold Border, Laurel & Gold Ribbon)
// ─────────────────────────────────────────────────────────────────────────────
async function generatePadmaBhushan() {
  const imgPath = path.join(userDir, 'media_1788675039758.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean QR Code box
  fillRectSmooth(ctx, 555, 90, 80, 80, '#fcfaf5');

  // 2. Clean Photo inside circular golden laurel frame (center ~361, y: 340, radius ~72)
  ctx.save();
  ctx.beginPath();
  ctx.arc(361, 340, 72, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(280, 260, 160, 160);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 3. Clean Golden Ribbon Banner text across bottom of circle
  const ribbonGrad = ctx.createLinearGradient(250, 420, 470, 440);
  ribbonGrad.addColorStop(0, '#cda250');
  ribbonGrad.addColorStop(0.3, '#edd28b');
  ribbonGrad.addColorStop(0.7, '#f5e4ab');
  ribbonGrad.addColorStop(1, '#cda250');

  ctx.save();
  ctx.beginPath();
  ctx.rect(265, 415, 192, 28);
  ctx.closePath();
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(265, 415, 192, 28);
  ctx.restore();

  // 4. Clean Citation & Recipient Name in body
  fillRectSmooth(ctx, 160, 528, 400, 25, '#fcfaf5');
  fillRectSmooth(ctx, 150, 580, 420, 45, '#fcfaf5');
  fillRectSmooth(ctx, 150, 630, 420, 52, '#fcfaf5');
  fillRectSmooth(ctx, 290, 698, 142, 26, '#fcfaf5');

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
      borderWidth: 3
    },
    qrCode: {
      x: 560,
      y: 95,
      size: 68
    },
    fields: {
      ribbonName: {
        x: 361,
        y: 435,
        fontSize: 15,
        font: 'bold',
        color: '#2a1a08',
        align: 'center',
        maxWidth: 180
      },
      fullName: {
        x: 361,
        y: 610,
        fontSize: 28,
        font: 'bold',
        color: '#111827',
        align: 'center',
        maxWidth: 420
      },
      letterIssuedAt: {
        x: 361,
        y: 715,
        fontSize: 14,
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
// 4. Bhartiye Gaurav Ratan Samman (Emerald Green & Gold Border)
// ─────────────────────────────────────────────────────────────────────────────
async function generateGauravRatan() {
  const imgPath = path.join(userDir, 'media_1788675039781.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean QR Code box
  fillRectSmooth(ctx, 532, 95, 85, 82, '#fcfaf2');

  // 2. Clean Top Left Ref info
  fillRectSmooth(ctx, 70, 95, 205, 68, '#fcfaf2');

  // 3. Clean Photo inside rounded border
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(255, 548, 172, 190, 8);
  } else {
    ctx.rect(255, 548, 172, 190);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f8f4e6';
  ctx.fillRect(255, 548, 172, 190);
  ctx.strokeStyle = '#2d5a27';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Recipient Name
  fillRectSmooth(ctx, 160, 742, 360, 32, '#fcf9ee');

  // 5. Clean Category & Citation details
  fillRectSmooth(ctx, 120, 826, 442, 45, '#fcf9ee');

  // 6. Clean Date of Issue
  fillRectSmooth(ctx, 335, 870, 120, 22, '#fcf9ee');

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
      borderWidth: 2
    },
    qrCode: {
      x: 540,
      y: 100,
      size: 72
    },
    fields: {
      refText: {
        x: 74,
        y: 110,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'normal',
        align: 'left'
      },
      fullName: {
        x: 341,
        y: 765,
        fontSize: 24,
        font: 'bold',
        color: '#1a1a1a',
        align: 'center',
        maxWidth: 380
      },
      category: {
        x: 341,
        y: 842,
        fontSize: 12,
        font: 'normal',
        color: '#2a2a2a',
        align: 'center',
        maxWidth: 440,
        wrap: true,
        lineHeight: 16
      },
      letterIssuedAt: {
        x: 341,
        y: 882,
        fontSize: 12,
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
// 5. Best Business Icon Award (Royal Navy Blue & Gold Border, Laurel & Navy Ribbon)
// ─────────────────────────────────────────────────────────────────────────────
async function generateBestBusinessIcon() {
  const imgPath = path.join(userDir, 'media_1788675039947.jpg');
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 1. Clean QR Code box
  fillRectSmooth(ctx, 560, 80, 85, 82, '#ffffff');

  // 2. Clean Top Left Ref info
  fillRectSmooth(ctx, 70, 80, 205, 68, '#ffffff');

  // 3. Clean Photo inside circular golden laurel frame (center 356, y: 490, radius: 108)
  ctx.save();
  ctx.beginPath();
  ctx.arc(356, 490, 108, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(240, 370, 240, 240);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Navy Blue 3D Ribbon Banner text across bottom of laurel wreath (y: 590 to 645)
  const ribbonGrad = ctx.createLinearGradient(180, 600, 530, 640);
  ribbonGrad.addColorStop(0, '#0c2461');
  ribbonGrad.addColorStop(0.2, '#1e3799');
  ribbonGrad.addColorStop(0.5, '#274bbf');
  ribbonGrad.addColorStop(0.8, '#1e3799');
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
      borderWidth: 4
    },
    qrCode: {
      x: 568,
      y: 86,
      size: 72
    },
    fields: {
      refText: {
        x: 74,
        y: 95,
        fontSize: 10,
        lineHeight: 14,
        color: '#1a1a1a',
        font: 'normal',
        align: 'left'
      },
      fullName: {
        x: 356,
        y: 630,
        fontSize: 26,
        font: 'bold',
        color: '#f6e58d',
        align: 'center',
        maxWidth: 310
      },
      awardTitle: {
        x: 356,
        y: 740,
        fontSize: 22,
        font: 'bold',
        color: '#0c2461',
        align: 'center'
      }
    }
  };

  fs.writeFileSync(path.join(configDir, 'Best Business Icon Award.json'), JSON.stringify(config, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all generators
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('--- Generating Clean Blank Certificate Templates ---');
  await generateAshokSamman();
  await generateInternationalBusinessExcellence();
  await generatePadmaBhushan();
  await generateGauravRatan();
  await generateBestBusinessIcon();
  console.log('=== All 5 Blank Certificate Templates & Configs Successfully Generated! ===');
}

main().catch((err) => {
  console.error('Fatal Template Generation Error:', err);
  process.exit(1);
});
