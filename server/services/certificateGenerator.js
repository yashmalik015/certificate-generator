import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, '../../src/assets/certificate-templates');
const configDir = path.join(templatesDir, 'config');
const uploadsDir = path.resolve(__dirname, '../uploads/certificates');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const getAvailableTemplates = () => {
  if (!fs.existsSync(templatesDir)) return [];
  const files = fs.readdirSync(templatesDir);
  return files
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg'))
    .map((filename) => {
      const ext = path.extname(filename);
      const id = path.basename(filename, ext);
      const jsonFile = path.join(configDir, `${id}.json`);
      const hasConfig = fs.existsSync(jsonFile);
      // Format human-readable label
      const label = id
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        id,
        filename,
        label,
        hasConfig
      };
    });
};

export const generateCertificate = async (studentData, templateId) => {
  const sanitize = (str) => String(str).replace(/[\/\s\:\\]/g, '_');
  const refnoClean = sanitize(studentData.refno || 'REF000');
  const templateIdClean = sanitize(templateId);

  const pngTemplatePath = path.join(templatesDir, `${templateId}.png`);
  const jsonConfigPath = path.join(configDir, `${templateId}.json`);

  let bgImage;
  let config;

  if (fs.existsSync(pngTemplatePath)) {
    bgImage = await loadImage(pngTemplatePath);
  }

  if (fs.existsSync(jsonConfigPath)) {
    const raw = fs.readFileSync(jsonConfigPath, 'utf8');
    config = JSON.parse(raw);
  } else {
    // Default fallback config
    config = {
      fields: {
        fullName: { x: 1200, y: 590, fontSize: 56, font: 'bold serif', color: '#0f172a', align: 'center' },
        category: { x: 1200, y: 760, fontSize: 34, font: 'bold sans-serif', color: '#b45309', align: 'center' },
        refno: { x: 300, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'left' },
        certificateNumber: { x: 1200, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'center' },
        letterIssuedAt: { x: 2100, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'right' }
      }
    };
  }

  const width = bgImage ? bgImage.width : 2400;
  const height = bgImage ? bgImage.height : 1600;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('WCAEO CERTIFICATE OF EXCELLENCE', width / 2, 200);
  }

  // Format values
  const dateFormatted = studentData.letterIssuedAt
    ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const values = {
    fullName: studentData.fullName || '',
    category: studentData.category || '',
    refno: `Ref: ${studentData.refno || ''}`,
    certificateNumber: `Cert No: ${studentData.certificateNumber || ''}`,
    letterIssuedAt: `Date: ${dateFormatted}`,
    fathersHusbandName: studentData.fathersHusbandName ? `S/D/W of: ${studentData.fathersHusbandName}` : ''
  };

  // Draw dynamic overlay fields according to JSON map
  if (config && config.fields) {
    Object.keys(config.fields).forEach((fieldName) => {
      const fieldConfig = config.fields[fieldName];
      const val = values[fieldName];
      if (val !== undefined && val !== null && val !== '') {
        ctx.fillStyle = fieldConfig.color || '#000000';
        ctx.font = `${fieldConfig.fontSize || 30}px ${fieldConfig.font || 'sans-serif'}`;
        ctx.textAlign = fieldConfig.align || 'left';
        ctx.fillText(String(val), fieldConfig.x, fieldConfig.y);
      }
    });
  }

  // Draw Recipient Photo inside Photo Box Frame
  try {
    const photoConfig = config.photo || { x: 1080, y: 840, width: 240, height: 240 };
    let photoLoaded = false;

    if (studentData.photoUrl) {
      const relativePhotoPath = studentData.photoUrl.replace(/^\//, '');
      const absolutePhotoPath = path.resolve(__dirname, '..', relativePhotoPath);

      if (fs.existsSync(absolutePhotoPath)) {
        console.log(`Loading student photo from: ${absolutePhotoPath}`);
        const photoImg = await loadImage(absolutePhotoPath);

        // Draw photo with 4px inner margin inside photo frame box
        const pad = 6;
        ctx.drawImage(
          photoImg,
          photoConfig.x + pad,
          photoConfig.y + pad,
          photoConfig.width - pad * 2,
          photoConfig.height - pad * 2
        );
        photoLoaded = true;
      } else {
        console.warn(`Photo file not found on server disk at: ${absolutePhotoPath}`);
      }
    }

    // Fallback: draw placeholder silhouette if photo not loaded
    if (!photoLoaded) {
      const px = photoConfig.x + 6;
      const py = photoConfig.y + 6;
      const pw = photoConfig.width - 12;
      const ph = photoConfig.height - 12;

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px, py, pw, ph);

      // Draw head silhouette
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph / 2 - 15, 35, 0, Math.PI * 2);
      ctx.fill();

      // Draw shoulder silhouette
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph + 25, 65, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RECIPIENT PHOTO', px + pw / 2, py + ph - 12);
    }
  } catch (photoErr) {
    console.error('Recipient photo rendering error:', photoErr);
  }

  // Draw QR Code for Verification Page
  try {
    const domain = process.env.APP_BASE_URL || 'http://localhost:5173';
    const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrConfig = config.qrCode || { x: 2050, y: 100, size: 180 };
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: qrConfig.size || 180,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(qrImage, qrConfig.x, qrConfig.y, qrConfig.size, qrConfig.size);

    // Label under QR code
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Verify', qrConfig.x + qrConfig.size / 2, qrConfig.y + qrConfig.size + 24);
  } catch (qrErr) {
    console.error('QR code generation error:', qrErr);
  }

  // Export PNG
  const outPngName = `${refnoClean}-${templateIdClean}.png`;
  const outPngPath = path.join(uploadsDir, outPngName);
  const pngBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPngPath, pngBuffer);

  // Convert composited PNG buffer to PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedPng(pngBuffer);
  const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: embeddedImage.width,
    height: embeddedImage.height
  });

  const pdfBytes = await pdfDoc.save();
  const outPdfName = `${refnoClean}-${templateIdClean}.pdf`;
  const outPdfPath = path.join(uploadsDir, outPdfName);
  fs.writeFileSync(outPdfPath, pdfBytes);

  return {
    templateId,
    pngUrl: `/uploads/certificates/${outPngName}`,
    pdfUrl: `/uploads/certificates/${outPdfName}`
  };
};
