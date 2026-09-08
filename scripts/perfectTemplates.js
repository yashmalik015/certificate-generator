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
destDirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

function createCalligraphicSignature(isCoFounder = false) {
  const canvas = createCanvas(260, 90);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 260, 90);
  ctx.strokeStyle = '#0f294a';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (!isCoFounder) {
    ctx.moveTo(30, 60);
    ctx.bezierCurveTo(50, 20, 70, 75, 100, 35);
    ctx.bezierCurveTo(120, 10, 135, 65, 160, 45);
    ctx.bezierCurveTo(180, 30, 210, 55, 235, 48);
    ctx.moveTo(35, 68);
    ctx.bezierCurveTo(80, 62, 140, 64, 210, 58);
  } else {
    ctx.moveTo(35, 48);
    ctx.bezierCurveTo(55, 65, 80, 20, 110, 52);
    ctx.bezierCurveTo(130, 70, 155, 25, 185, 40);
    ctx.bezierCurveTo(205, 50, 225, 30, 240, 38);
    ctx.moveTo(50, 65);
    ctx.bezierCurveTo(95, 68, 160, 60, 225, 66);
  }
  ctx.stroke();
  return canvas;
}

async function perfectAll() {
  const logoPath = path.resolve(rootDir, 'public/ihreo-logo.png');
  const logoImg = await loadImage(logoPath);
  const sigFounder = createCalligraphicSignature(false);
  const sigCoFounder = createCalligraphicSignature(true);

  const templates = [
    {
      file: 'media_1788854868587.jpg',
      name: 'Arya Bhushan Samaj Seva Award',
      bgHex: '#fbfcec',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        ctx.fillStyle = '#fbfcec';

        // 1. Clear top-left CIN / reg numbers
        ctx.fillRect(65, 55, 235, 90);

        // 2. Clear old center logo & composite official IHREO logo
        ctx.fillRect(310, 40, 108, 98);
        ctx.drawImage(logoImg, 318, 44, 92, 92);

        // 3. Clear preprinted "International Business & Entrepreneurship," (exact bounds: y: 694 to 726)
        ctx.fillRect(80, 694, 568, 32);

        // 4. Signatures above Founder & Co-Founder titles at bottom
        ctx.drawImage(sigFounder, 120, 865, 130, 45);
        ctx.drawImage(sigCoFounder, 520, 865, 130, 45);
      }
    },
    {
      file: 'media_1788854868611.jpg',
      name: 'Best Business Icon Award',
      bgHex: '#eaf5fb',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        ctx.fillStyle = '#eaf5fb';

        // 1. Clear top-left CIN / Sl No / Reg No
        ctx.fillRect(60, 55, 230, 105);

        // 2. Clear old crest & composite official IHREO logo
        ctx.fillRect(298, 45, 118, 102);
        ctx.drawImage(logoImg, 310, 52, 94, 94);

        // 3. Clear old name area on ribbon
        ctx.fillStyle = '#102b54';
        ctx.fillRect(200, 606, 314, 40);

        // 4. Signatures above Founder & Co-Founder titles at bottom
        ctx.drawImage(sigFounder, 115, 865, 130, 45);
        ctx.drawImage(sigCoFounder, 485, 865, 130, 45);
      }
    },
    {
      file: 'media_1788854868644.jpg',
      name: 'Bhartiya Padma Bhushan Samman',
      bgHex: '#f9f4e8',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        ctx.fillStyle = '#f9f4e8';

        // 1. Clear top-left CIN / reg numbers
        ctx.fillRect(65, 55, 230, 105);

        // 2. Clear old emblem & composite official IHREO logo
        ctx.fillRect(315, 42, 92, 86);
        ctx.drawImage(logoImg, 317, 44, 88, 88);

        // 3. Clean preprinted ribbon text with metallic gold gradient
        const grad = ctx.createLinearGradient(258, 414, 466, 450);
        grad.addColorStop(0, '#e5be6b');
        grad.addColorStop(0.5, '#fae19a');
        grad.addColorStop(1, '#d8ad57');
        ctx.fillStyle = grad;
        ctx.fillRect(258, 414, 208, 36);

        // 4. Signatures above Founder & Co-Founder titles at bottom
        ctx.drawImage(sigFounder, 120, 715, 130, 45);
        ctx.drawImage(sigCoFounder, 475, 715, 130, 45);
      }
    },
    {
      file: 'media_1788854868661.jpg',
      name: 'Bhartiye Gaurav Ratan Samman',
      bgHex: '#fff8eb',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        ctx.fillStyle = '#fff8eb';

        // 1. Clear top-left CIN / Licence No / Sl No / Reg No
        ctx.fillRect(60, 55, 225, 115);

        // 2. Clear old top logo & composite official IHREO logo
        ctx.fillRect(295, 34, 90, 88);
        ctx.drawImage(logoImg, 298, 35, 84, 84);

        // 3. Clear preprinted "Wild Life Expert"
        ctx.fillRect(305, 828, 120, 24);

        // 4. Signatures above Founder & Co-Founder titles at bottom
        ctx.drawImage(sigFounder, 115, 885, 130, 45);
        ctx.drawImage(sigCoFounder, 465, 885, 130, 45);
      }
    },
    {
      file: 'media_1788854868669.jpg',
      name: 'women icon award',
      bgHex: '#f6efe1',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        ctx.fillStyle = '#f6efe1';

        // 1. Clear top-left CIN / Licence No / Sl No / Reg No
        ctx.fillRect(60, 55, 225, 115);

        // 2. Clear old center logo inside laurel wreath
        ctx.save();
        ctx.beginPath();
        ctx.arc(341, 305, 54, 0, Math.PI * 2);
        ctx.fillStyle = '#f6efe1';
        ctx.fill();
        ctx.restore();
        ctx.drawImage(logoImg, 297, 261, 88, 88);

        // 3. Signatures above Founder & Co-Founder titles at bottom
        ctx.drawImage(sigFounder, 115, 885, 130, 45);
        ctx.drawImage(sigCoFounder, 480, 885, 130, 45);
      }
    }
  ];

  for (const t of templates) {
    const rawPath = path.resolve(
      `/Users/yashmalik/.gemini/antigravity-ide/brain/4b8f9276-e43d-4ad8-b7d4-ad6026c1fa31/.user_uploaded/${t.file}`
    );
    const baseImg = await loadImage(rawPath);
    const canvas = createCanvas(baseImg.width, baseImg.height);
    const ctx = canvas.getContext('2d');
    t.process(canvas, ctx, baseImg);

    const pngBuf = canvas.toBuffer('image/png');

    const pdfDoc = await PDFDocument.create();
    const embeddedImg = await pdfDoc.embedPng(pngBuf);
    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
    const pdfBuf = await pdfDoc.save();

    for (const d of destDirs) {
      fs.writeFileSync(path.join(d, `${t.name}.png`), pngBuf);
      fs.writeFileSync(path.join(d, `${t.name}.pdf`), pdfBuf);
    }
    console.log(`✓ Flawlessly perfected template: ${t.name}`);
  }
}

perfectAll().catch(console.error);
