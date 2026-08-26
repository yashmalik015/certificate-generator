import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const templatesDir = path.resolve(__dirname, '../../src/assets/certificate-templates');
const configDir = path.join(templatesDir, 'config');
const uploadsDir = isVercel
  ? path.join('/tmp', 'uploads', 'certificates')
  : path.resolve(__dirname, '../uploads/certificates');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (mkdirErr) {
  console.warn('Certificates directory setup warning:', mkdirErr.message);
}

// Format font string into valid Canvas API syntax: "[style] [weight] [size]px [family]"
const formatCanvasFont = (size, fontStr) => {
  const str = String(fontStr || '').toLowerCase();
  const isBold = str.includes('bold');
  const isItalic = str.includes('italic');
  let family = 'sans-serif';
  if (str.includes('serif') && !str.includes('sans')) {
    family = 'serif';
  }
  const weightStr = isBold ? 'bold ' : '';
  const styleStr = isItalic ? 'italic ' : '';
  return `${styleStr}${weightStr}${size || 30}px ${family}`;
};

export const getAvailableTemplates = () => {
  if (!fs.existsSync(templatesDir)) return [];
  try {
    const files = fs.readdirSync(templatesDir);
    return files
      .filter((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg'))
      .map((filename) => {
        const ext = path.extname(filename);
        const id = path.basename(filename, ext);
        const jsonFile = path.join(configDir, `${id}.json`);
        const hasConfig = fs.existsSync(jsonFile);
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
  } catch (err) {
    console.warn('Failed to list template files:', err.message);
    return [
      { id: 'Bhartiya Samaj Seva award', filename: 'Bhartiya Samaj Seva award.png', label: 'Bhartiya Samaj Seva award', hasConfig: true },
      { id: 'Doctorate IHREO', filename: 'Doctorate IHREO.png', label: 'Doctorate IHREO', hasConfig: true }
    ];
  }
};

export const generateCertificate = async (studentData, templateId) => {
  const sanitize = (str) => String(str).replace(/[\/\s\:\\]/g, '_');
  const refnoClean = sanitize(studentData.refno || 'REF000');
  const templateIdClean = sanitize(templateId);

  const outPngName = `${refnoClean}-${templateIdClean}.png`;
  const outPdfName = `${refnoClean}-${templateIdClean}.pdf`;
  const outPngPath = path.join(uploadsDir, outPngName);
  const outPdfPath = path.join(uploadsDir, outPdfName);

  try {
    const pngTemplatePath = path.join(templatesDir, `${templateId}.png`);
    const jsonConfigPath = path.join(configDir, `${templateId}.json`);

    let bgImage;
    let config;

    if (fs.existsSync(pngTemplatePath)) {
      try {
        bgImage = await loadImage(pngTemplatePath);
      } catch (err) {
        console.warn(`Failed to load template image ${pngTemplatePath}:`, err.message);
      }
    }

    if (fs.existsSync(jsonConfigPath)) {
      try {
        const raw = fs.readFileSync(jsonConfigPath, 'utf8');
        config = JSON.parse(raw);
      } catch (err) {
        console.warn(`Failed to parse config JSON ${jsonConfigPath}:`, err.message);
      }
    }

    if (!config) {
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

    // Draw dynamic overlay fields with valid Canvas font syntax
    if (config && config.fields) {
      Object.keys(config.fields).forEach((fieldName) => {
        const fieldConfig = config.fields[fieldName];
        const val = values[fieldName];
        if (val !== undefined && val !== null && val !== '') {
          ctx.fillStyle = fieldConfig.color || '#000000';
          ctx.font = formatCanvasFont(fieldConfig.fontSize, fieldConfig.font);
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
        let photoImg = null;
        if (studentData.photoUrl.startsWith('data:') || studentData.photoUrl.startsWith('http')) {
          try {
            photoImg = await loadImage(studentData.photoUrl);
          } catch (pErr) {
            console.warn('Failed to load photo URL:', pErr.message);
          }
        } else {
          const relPath = studentData.photoUrl.replace(/^\//, '');
          const path1 = path.join('/tmp', relPath);
          const path2 = path.resolve(__dirname, '..', relPath);
          const targetPath = fs.existsSync(path1) ? path1 : (fs.existsSync(path2) ? path2 : null);

          if (targetPath) {
            try {
              const buf = fs.readFileSync(targetPath);
              photoImg = await loadImage(buf);
            } catch (pErr) {
              console.warn(`Failed to load photo buffer from ${targetPath}:`, pErr.message);
            }
          }
        }

        if (photoImg) {
          const pad = 6;
          ctx.drawImage(
            photoImg,
            photoConfig.x + pad,
            photoConfig.y + pad,
            photoConfig.width - pad * 2,
            photoConfig.height - pad * 2
          );
          photoLoaded = true;
        }
      }

      if (!photoLoaded) {
        const px = photoConfig.x + 6;
        const py = photoConfig.y + 6;
        const pw = photoConfig.width - 12;
        const ph = photoConfig.height - 12;

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2 - 15, 35, 0, Math.PI * 2);
        ctx.fill();
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
      const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
      const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
      const qrConfig = config.qrCode || { x: 2050, y: 100, size: 180 };
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        width: qrConfig.size || 180,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
      const qrImage = await loadImage(qrBuffer);
      ctx.drawImage(qrImage, qrConfig.x, qrConfig.y, qrConfig.size, qrConfig.size);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to Verify', qrConfig.x + qrConfig.size / 2, qrConfig.y + qrConfig.size + 24);
    } catch (qrErr) {
      console.error('QR code generation error:', qrErr);
    }

    // Export PNG
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
    fs.writeFileSync(outPdfPath, pdfBytes);

    return {
      templateId,
      pngUrl: `/uploads/certificates/${outPngName}`,
      pdfUrl: `/uploads/certificates/${outPdfName}`
    };
  } catch (err) {
    console.error('Canvas certificate generation error, using pdf-lib fallback:', err);

    // Pure JavaScript PDF fallback
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([2400, 1600]);

      page.drawRectangle({
        x: 40,
        y: 40,
        width: 2320,
        height: 1520,
        borderColor: rgb(0.85, 0.47, 0.03),
        borderWidth: 6
      });

      page.drawText('WORLD COUNCIL OF ACADEMIC & EDUCATIONAL ORGANIZATIONS', {
        x: 400,
        y: 1400,
        size: 38,
        font,
        color: rgb(0.06, 0.09, 0.16)
      });

      page.drawText(templateId.toUpperCase(), {
        x: 700,
        y: 1250,
        size: 48,
        font,
        color: rgb(0.7, 0.35, 0.05)
      });

      page.drawText(studentData.fullName || 'Recipient Name', {
        x: 900,
        y: 1000,
        size: 54,
        font,
        color: rgb(0.06, 0.09, 0.16)
      });

      page.drawText(studentData.category || 'Award Category', {
        x: 950,
        y: 850,
        size: 36,
        font,
        color: rgb(0.7, 0.35, 0.05)
      });

      page.drawText(`Ref: ${studentData.refno || ''}`, {
        x: 100,
        y: 100,
        size: 24,
        font,
        color: rgb(0.28, 0.33, 0.41)
      });

      page.drawText(`Cert No: ${studentData.certificateNumber || ''}`, {
        x: 1000,
        y: 100,
        size: 24,
        font,
        color: rgb(0.28, 0.33, 0.41)
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outPdfPath, pdfBytes);
      fs.writeFileSync(outPngPath, Buffer.from([]));
    } catch (pdfErr) {
      console.error('Fatal PDF fallback error:', pdfErr);
    }

    return {
      templateId,
      pngUrl: `/uploads/certificates/${outPngName}`,
      pdfUrl: `/uploads/certificates/${outPdfName}`
    };
  }
};
