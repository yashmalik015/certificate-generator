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
 * High-quality seamless bilateral inpainter.
 * Blends surrounding parchment / background texture smoothly across any bounding box
 * so there are ZERO white bars, rectangles, or seams.
 */
function seamlessInpaint(ctx, x, y, w, h, pad = 6) {
  const cW = ctx.canvas.width;
  const cH = ctx.canvas.height;
  const imgData = ctx.getImageData(0, 0, cW, cH);
  const data = imgData.data;

  function getPixel(px, py) {
    px = Math.max(0, Math.min(cW - 1, Math.round(px)));
    py = Math.max(0, Math.min(cH - 1, Math.round(py)));
    const idx = (py * cW + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  for (let py = y; py < y + h; py++) {
    const ty = (py - y) / Math.max(1, h - 1);
    for (let px = x; px < x + w; px++) {
      const tx = (px - x) / Math.max(1, w - 1);

      // Average pad pixels from each edge
      let top = [0, 0, 0], btm = [0, 0, 0], lft = [0, 0, 0], rgt = [0, 0, 0];
      for (let i = 1; i <= pad; i++) {
        const t = getPixel(px, y - i);
        const b = getPixel(px, y + h - 1 + i);
        const l = getPixel(x - i, py);
        const r = getPixel(x + w - 1 + i, py);
        for (let c = 0; c < 3; c++) {
          top[c] += t[c] / pad;
          btm[c] += b[c] / pad;
          lft[c] += l[c] / pad;
          rgt[c] += r[c] / pad;
        }
      }

      // Vertical and horizontal color blends
      const cv = [
        top[0] * (1 - ty) + btm[0] * ty,
        top[1] * (1 - ty) + btm[1] * ty,
        top[2] * (1 - ty) + btm[2] * ty
      ];
      const ch = [
        lft[0] * (1 - tx) + rgt[0] * tx,
        lft[1] * (1 - tx) + rgt[1] * tx,
        lft[2] * (1 - tx) + rgt[2] * tx
      ];

      // Distance weight
      const distTop = ty;
      const distBtm = 1 - ty;
      const distLft = tx;
      const distRgt = 1 - tx;
      const minH = Math.min(distLft, distRgt);
      const minV = Math.min(distTop, distBtm);
      const total = minH + minV || 1;
      const weightH = minV / total;
      const weightV = minH / total;

      const idx = (py * cW + px) * 4;
      data[idx] = Math.round(ch[0] * weightH + cv[0] * weightV);
      data[idx + 1] = Math.round(ch[1] * weightH + cv[1] * weightV);
      data[idx + 2] = Math.round(ch[2] * weightH + cv[2] * weightV);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// Save clean PNG and PDF into all required static/server paths
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

  // 1. Inpaint QR Code box (Top Right)
  seamlessInpaint(ctx, 528, 65, 95, 90, 8);

  // 2. Inpaint Top Left Sl No
  seamlessInpaint(ctx, 65, 65, 215, 75, 8);

  // 3. Clean Photo inside rounded border - blend softly with parchment inner
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(280, 563, 122, 137, 6);
  } else {
    ctx.rect(280, 563, 122, 137);
  }
  ctx.closePath();
  ctx.clip();
  seamlessInpaint(ctx, 280, 563, 122, 137, 8);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 4. Inpaint Recipient Name seamlessly (NO white bar!)
  seamlessInpaint(ctx, 150, 700, 380, 40, 8);

  // 5. Inpaint Category & Citation details seamlessly
  seamlessInpaint(ctx, 110, 775, 460, 50, 8);

  // 6. Inpaint Date of Issue seamlessly
  seamlessInpaint(ctx, 330, 822, 130, 28, 8);

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

  // 1. Inpaint QR Code box (Top Right)
  seamlessInpaint(ctx, 575, 75, 95, 90, 8);

  // 2. Inpaint Top Left Ref info
  seamlessInpaint(ctx, 85, 75, 215, 75, 8);

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
  seamlessInpaint(ctx, 312, 362, 110, 120, 8);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 4. Inpaint Recipient Name seamlessly without removing clean background
  seamlessInpaint(ctx, 220, 502, 395, 38, 8);
  // Redraw clean golden underline
  ctx.save();
  ctx.strokeStyle = '#8b6f52';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(225, 542);
  ctx.lineTo(608, 542);
  ctx.stroke();
  ctx.restore();

  // 5. Inpaint Date of Issue seamlessly
  seamlessInpaint(ctx, 380, 830, 130, 30, 8);

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

  // 1. Inpaint QR Code box (Top Right)
  seamlessInpaint(ctx, 550, 85, 90, 90, 8);

  // 2. Clean Photo inside circular golden laurel frame (center 361, y: 340, radius: 72)
  ctx.save();
  ctx.beginPath();
  ctx.arc(361, 340, 72, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  seamlessInpaint(ctx, 280, 260, 160, 160, 8);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // 3. Clean Golden Ribbon Banner text across bottom of circle using continuous metallic gradient
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

  // 4. Inpaint Citation & Recipient Name seamlessly (NO white bars!)
  seamlessInpaint(ctx, 150, 524, 420, 32, 8);
  seamlessInpaint(ctx, 140, 575, 440, 52, 8);
  seamlessInpaint(ctx, 140, 630, 440, 52, 8);
  seamlessInpaint(ctx, 280, 695, 160, 30, 8);

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
      fullName: {
        x: 361,
        y: 612,
        fontSize: 26,
        font: 'bold',
        color: '#111827',
        align: 'center',
        maxWidth: 420
      },
      letterIssuedAt: {
        x: 361,
        y: 716,
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

  // 1. Inpaint QR Code box (Top Right)
  seamlessInpaint(ctx, 525, 90, 95, 90, 8);

  // 2. Inpaint Top Left Ref info
  seamlessInpaint(ctx, 65, 90, 215, 75, 8);

  // 3. Clean Photo inside rounded green border
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(255, 548, 172, 190, 8);
  } else {
    ctx.rect(255, 548, 172, 190);
  }
  ctx.closePath();
  ctx.clip();
  seamlessInpaint(ctx, 255, 548, 172, 190, 8);
  ctx.strokeStyle = '#2d5a27';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 4. Inpaint Recipient Name seamlessly (NO white bar!)
  seamlessInpaint(ctx, 150, 738, 380, 40, 8);

  // 5. Inpaint Category & Citation details seamlessly
  seamlessInpaint(ctx, 110, 820, 460, 50, 8);

  // 6. Inpaint Date of Issue seamlessly
  seamlessInpaint(ctx, 330, 866, 130, 28, 8);

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

  // 1. Inpaint QR Code box (Top Right)
  seamlessInpaint(ctx, 555, 75, 95, 90, 8);

  // 2. Inpaint Top Left Ref info
  seamlessInpaint(ctx, 65, 75, 215, 75, 8);

  // 3. Clean Photo inside circular golden laurel frame (center 356, y: 490, radius: 108)
  ctx.save();
  ctx.beginPath();
  ctx.arc(356, 490, 108, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  seamlessInpaint(ctx, 240, 370, 240, 240, 8);
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 4. Clean Navy Blue 3D Ribbon Banner text across bottom of laurel wreath (seamless silk gradient)
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
  console.log('--- Generating 100% Pristine Seamless Blank Certificate Templates ---');
  await generateAshokSamman();
  await generateInternationalBusinessExcellence();
  await generatePadmaBhushan();
  await generateGauravRatan();
  await generateBestBusinessIcon();
  console.log('=== All 5 Blank Certificate Templates & Configs Successfully Generated with ZERO White Bars! ===');
}

main().catch((err) => {
  console.error('Fatal Template Generation Error:', err);
  process.exit(1);
});
