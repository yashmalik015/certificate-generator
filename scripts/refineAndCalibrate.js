import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Destination dirs
const destDirs = [
  path.resolve(rootDir, 'src/assets/certificate-templates'),
  path.resolve(rootDir, 'public/assets/certificate-templates'),
  path.resolve(rootDir, 'public/certificate-templates')
];
destDirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Signature generator
function createCalligraphicSignature(name, isCoFounder = false) {
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

async function run() {
  const logoPath = path.resolve(rootDir, 'public/ihreo-logo.png');
  const logoImg = await loadImage(logoPath);
  const sigFounder = createCalligraphicSignature('Founder', false);
  const sigCoFounder = createCalligraphicSignature('Co-Founder', true);

  const rawUserAssets = [
    {
      file: 'media_1788854868587.jpg',
      name: 'Arya Bhushan Samaj Seva Award',
      bgHex: '#fbfcec',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        // 1. Clear top-left CIN / reg numbers
        ctx.fillStyle = '#fbfcec';
        ctx.fillRect(0, 0, 300, 145);

        // 2. Clear old logo & replace with official IHREO logo
        ctx.fillRect(305, 30, 120, 110);
        ctx.drawImage(logoImg, 318, 44, 92, 92);

        // 3. Clear pre-printed text on category line
        ctx.fillRect(80, 680, 570, 48);

        // 4. Clear old date area on the underline
        ctx.fillRect(390, 840, 170, 22);
        // redraw crisp underline
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(390, 856);
        ctx.lineTo(540, 856);
        ctx.stroke();

        // 5. Signatures
        ctx.drawImage(sigFounder, 100, 830, 130, 45);
        ctx.drawImage(sigCoFounder, 510, 830, 130, 45);
      }
    },
    {
      file: 'media_1788854868611.jpg',
      name: 'Best Business Icon Award',
      bgHex: '#edf6fb',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        // 1. Clear top-left CIN
        ctx.fillStyle = '#edf6fb';
        ctx.fillRect(0, 0, 290, 140);

        // 2. Clear old crest & replace with official IHREO logo
        ctx.fillRect(295, 35, 125, 120);
        ctx.drawImage(logoImg, 310, 50, 94, 94);

        // 3. Clear old name area on ribbon
        ctx.fillStyle = '#102b54';
        ctx.fillRect(200, 606, 314, 40);

        // 4. Signatures
        ctx.drawImage(sigFounder, 95, 825, 130, 45);
        ctx.drawImage(sigCoFounder, 465, 825, 130, 45);
      }
    },
    {
      file: 'media_1788854868644.jpg',
      name: 'Bhartiya Padma Bhushan Samman',
      bgHex: '#f8f2e4',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        // 1. Clear top-left CIN
        ctx.fillStyle = '#f8f2e4';
        ctx.fillRect(0, 0, 300, 135);

        // 2. Clear old emblem & replace with official IHREO logo
        ctx.fillRect(305, 38, 115, 96);
        ctx.drawImage(logoImg, 317, 44, 88, 88);

        // 3. Clear old name on ribbon with metallic gold
        const grad = ctx.createLinearGradient(258, 414, 466, 450);
        grad.addColorStop(0, '#e5be6b');
        grad.addColorStop(0.5, '#fae19a');
        grad.addColorStop(1, '#d8ad57');
        ctx.fillStyle = grad;
        ctx.fillRect(258, 414, 208, 38);

        // 4. Clear space between "is presented to" and divider line
        ctx.fillStyle = '#fdfaf2';
        ctx.fillRect(150, 580, 420, 35);

        // 5. Clear old date area after "this day "
        ctx.fillRect(470, 884, 140, 24);

        // 6. Signatures
        ctx.drawImage(sigFounder, 105, 705, 130, 45);
        ctx.drawImage(sigCoFounder, 455, 705, 130, 45);
      }
    },
    {
      file: 'media_1788854868661.jpg',
      name: 'Bhartiye Gaurav Ratan Samman',
      bgHex: '#fff8ea',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        // 1. Clear top-left CIN
        ctx.fillStyle = '#fff8ea';
        ctx.fillRect(0, 0, 280, 135);

        // 2. Clear old logo & composite official IHREO logo cleanly
        ctx.fillRect(285, 30, 110, 95);
        ctx.drawImage(logoImg, 298, 35, 84, 84);

        // 3. Clear pre-printed "Wild Life Expert"
        ctx.fillRect(295, 825, 145, 26);

        // 4. Clear date underline area
        ctx.fillRect(330, 865, 140, 20);
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(330, 880);
        ctx.lineTo(470, 880);
        ctx.stroke();

        // 5. Signatures
        ctx.drawImage(sigFounder, 95, 835, 130, 45);
        ctx.drawImage(sigCoFounder, 445, 835, 130, 45);
      }
    },
    {
      file: 'media_1788854868669.jpg',
      name: 'women icon award',
      bgHex: '#f3ebd4',
      process: (canvas, ctx, baseImg) => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);

        // 1. Clear top-left CIN
        ctx.fillStyle = '#f3ebd4';
        ctx.fillRect(0, 0, 280, 135);

        // 2. Clear old center logo inside laurel wreath
        ctx.save();
        ctx.beginPath();
        ctx.arc(341, 305, 54, 0, Math.PI * 2);
        ctx.fillStyle = '#f2ead3';
        ctx.fill();
        ctx.restore();
        ctx.drawImage(logoImg, 297, 261, 88, 88);

        // 3. Clear date underline area
        ctx.fillStyle = '#f3ebd4';
        ctx.fillRect(345, 798, 140, 22);
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(345, 814);
        ctx.lineTo(475, 814);
        ctx.stroke();

        // 4. Signatures
        ctx.drawImage(sigFounder, 95, 835, 130, 45);
        ctx.drawImage(sigCoFounder, 465, 835, 130, 45);
      }
    }
  ];

  for (const item of rawUserAssets) {
    const rawPath = path.resolve(__dirname, `../artifacts/.user_uploaded/${item.file}`);
    const fallbackPath = path.resolve(
      `/Users/yashmalik/.gemini/antigravity-ide/brain/4b8f9276-e43d-4ad8-b7d4-ad6026c1fa31/.user_uploaded/${item.file}`
    );
    const actualPath = fs.existsSync(rawPath) ? rawPath : fallbackPath;
    if (!fs.existsSync(actualPath)) {
      console.warn(`Missing user uploaded file: ${item.file}`);
      continue;
    }

    const baseImg = await loadImage(actualPath);
    const canvas = createCanvas(baseImg.width, baseImg.height);
    const ctx = canvas.getContext('2d');
    item.process(canvas, ctx, baseImg);

    const pngBuf = canvas.toBuffer('image/png');

    // Create PDF page with image
    const pdfDoc = await PDFDocument.create();
    const embeddedImg = await pdfDoc.embedPng(pngBuf);
    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
    const pdfBuf = await pdfDoc.save();

    // Save to all destinations
    for (const d of destDirs) {
      fs.writeFileSync(path.join(d, `${item.name}.png`), pngBuf);
      fs.writeFileSync(path.join(d, `${item.name}.pdf`), pdfBuf);
    }
    console.log(`✓ Refined and saved template: ${item.name} (${canvas.width}x${canvas.height})`);
  }
}

run().catch(console.error);
