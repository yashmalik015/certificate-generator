import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let canvasLibCache = undefined;
const getCanvasLib = async () => {
  if (canvasLibCache !== undefined) return canvasLibCache;
  try {
    const mod = await import('canvas');
    // Verify text rendering actually works before trusting canvas
    const testCanvas = mod.createCanvas(10, 10);
    const testCtx = testCanvas.getContext('2d');
    testCtx.font = '10px sans-serif';
    testCtx.fillText('A', 0, 10);
    const buf = testCanvas.toBuffer('image/png');
    // If buffer is empty or very small, text rendering is broken
    if (!buf || buf.length < 100) throw new Error('Canvas text rendering check failed');
    canvasLibCache = { createCanvas: mod.createCanvas, loadImage: mod.loadImage };
    return canvasLibCache;
  } catch (err) {
    console.warn('Canvas not available or text rendering broken, using pdf-lib:', err.message);
    canvasLibCache = null;
    return null;
  }
};

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

// Parse hex color to pdf-lib rgb()
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '#000000'));
  if (!result) return rgb(0, 0, 0);
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  );
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
        return { id, filename, label, hasConfig };
      });
  } catch (err) {
    console.warn('Failed to list template files:', err.message);
    return [
      { id: 'Bhartiya Samaj Seva award', filename: 'Bhartiya Samaj Seva award.png', label: 'Bhartiya Samaj Seva award', hasConfig: true },
      { id: 'Doctorate IHREO', filename: 'Doctorate IHREO.png', label: 'Doctorate IHREO', hasConfig: true }
    ];
  }
};

/**
 * Primary generation strategy: embed template PNG as PDF background,
 * then draw text/photo/QR using pdf-lib (no system fonts required).
 * Works reliably on Vercel and all serverless environments.
 */
const generateWithPdfLib = async (studentData, templateId, outPdfPath, outPngPath) => {
  const pngTemplatePath = path.join(templatesDir, `${templateId}.png`);
  const jsonConfigPath = path.join(configDir, `${templateId}.json`);

  let config = null;
  if (fs.existsSync(jsonConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf8'));
    } catch (e) {
      console.warn('Config parse warning:', e.message);
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
      },
      photo: { x: 1080, y: 840, width: 240, height: 240 },
      qrCode: { x: 2050, y: 100, size: 180 }
    };
  }

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Determine page size from template or default
  let pageWidth = 2400;
  let pageHeight = 1600;

  // Embed template PNG as background
  let templateEmbedded = false;
  if (fs.existsSync(pngTemplatePath)) {
    try {
      const templateBuffer = fs.readFileSync(pngTemplatePath);
      const embeddedTemplate = await pdfDoc.embedPng(templateBuffer);
      pageWidth = embeddedTemplate.width;
      pageHeight = embeddedTemplate.height;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedTemplate, { x: 0, y: 0, width: pageWidth, height: pageHeight });
      templateEmbedded = true;
    } catch (tErr) {
      console.warn('Template embed warning:', tErr.message);
    }
  }

  if (!pdfDoc.getPageCount()) {
    pdfDoc.addPage([pageWidth, pageHeight]);
  }
  const page = pdfDoc.getPage(0);

  // Format date and text values
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

  // Draw text fields using pdf-lib
  // NOTE: PDF coordinate system has y=0 at BOTTOM, canvas has y=0 at TOP.
  // Convert: pdfY = pageHeight - canvasY
  if (config && config.fields) {
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      const val = values[fieldName];
      if (!val) continue;

      const fontSize = fieldConfig.fontSize || 24;
      const useFont = String(fieldConfig.font || '').toLowerCase().includes('bold') ? fontBold : fontRegular;
      const color = hexToRgb(fieldConfig.color);

      // Convert canvas-top-left Y to pdf-bottom-left Y
      // Subtract fontSize to position baseline correctly
      const pdfY = pageHeight - fieldConfig.y;

      try {
        const textWidth = useFont.widthOfTextAtSize(val, fontSize);
        let drawX = fieldConfig.x;
        if (fieldConfig.align === 'center') drawX = fieldConfig.x - textWidth / 2;
        else if (fieldConfig.align === 'right') drawX = fieldConfig.x - textWidth;

        page.drawText(val, {
          x: Math.max(0, drawX),
          y: pdfY,
          size: fontSize,
          font: useFont,
          color
        });
      } catch (textErr) {
        console.warn(`Text draw warning for field ${fieldName}:`, textErr.message);
      }
    }
  }

  // Embed recipient photo
  const photoConfig = config.photo || { x: 1080, y: 840, width: 240, height: 240 };
  if (studentData.photoUrl) {
    try {
      let photoBuffer = null;
      let isPhotoJpeg = false;

      if (studentData.photoUrl.startsWith('data:image/')) {
        const base64Data = studentData.photoUrl.split(',')[1];
        if (base64Data) photoBuffer = Buffer.from(base64Data, 'base64');
        isPhotoJpeg = studentData.photoUrl.startsWith('data:image/jpeg') || studentData.photoUrl.startsWith('data:image/jpg');
      } else if (!studentData.photoUrl.startsWith('/')) {
        // Not a relative path
      } else {
        const relPath = studentData.photoUrl.replace(/^\//, '');
        const tryPaths = [path.join('/tmp', relPath), path.resolve(__dirname, '..', relPath)];
        for (const tryPath of tryPaths) {
          if (fs.existsSync(tryPath)) {
            photoBuffer = fs.readFileSync(tryPath);
            isPhotoJpeg = tryPath.endsWith('.jpg') || tryPath.endsWith('.jpeg');
            break;
          }
        }
      }

      if (photoBuffer && photoBuffer.length > 0) {
        let embeddedPhoto;
        try {
          embeddedPhoto = isPhotoJpeg ? await pdfDoc.embedJpg(photoBuffer) : await pdfDoc.embedPng(photoBuffer);
        } catch {
          // Try the other format if first fails
          try {
            embeddedPhoto = isPhotoJpeg ? await pdfDoc.embedPng(photoBuffer) : await pdfDoc.embedJpg(photoBuffer);
          } catch (e2) {
            console.warn('Photo embed failed both formats:', e2.message);
          }
        }
        if (embeddedPhoto) {
          // Convert canvas Y (top-left) to pdf Y (bottom-left)
          const pdfPhotoY = pageHeight - photoConfig.y - photoConfig.height;
          page.drawImage(embeddedPhoto, {
            x: photoConfig.x + 6,
            y: pdfPhotoY + 6,
            width: photoConfig.width - 12,
            height: photoConfig.height - 12
          });
        }
      }
    } catch (photoErr) {
      console.warn('Photo rendering warning:', photoErr.message);
    }
  }

  // Embed QR code
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator-two-nu.vercel.app';
    const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrConfig = config.qrCode || { x: 2050, y: 100, size: 180 };
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: qrConfig.size || 180 });
    const embeddedQr = await pdfDoc.embedPng(qrBuffer);
    // QR config Y is from top in canvas → convert to pdf bottom-left
    const pdfQrY = pageHeight - qrConfig.y - qrConfig.size;
    page.drawImage(embeddedQr, { x: qrConfig.x, y: pdfQrY, width: qrConfig.size, height: qrConfig.size });
  } catch (qrErr) {
    console.warn('QR embed warning:', qrErr.message);
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPdfPath, pdfBytes);

  // Write stub PNG (the PDF is the primary output)
  if (!fs.existsSync(outPngPath)) {
    fs.writeFileSync(outPngPath, Buffer.from([]));
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
    await generateWithPdfLib(studentData, templateId, outPdfPath, outPngPath);
    return {
      templateId,
      pngUrl: `/uploads/certificates/${outPngName}`,
      pdfUrl: `/uploads/certificates/${outPdfName}`
    };
  } catch (err) {
    console.error('Certificate generation error:', err);
    // Last-resort minimal PDF fallback
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([2400, 1600]);
      page.drawText(studentData.fullName || 'Recipient', { x: 800, y: 900, size: 56, font, color: rgb(0.06, 0.09, 0.16) });
      page.drawText(templateId, { x: 700, y: 800, size: 40, font, color: rgb(0.7, 0.35, 0.05) });
      page.drawText(`Ref: ${studentData.refno || ''}`, { x: 100, y: 100, size: 24, font, color: rgb(0.28, 0.33, 0.41) });
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outPdfPath, pdfBytes);
      fs.writeFileSync(outPngPath, Buffer.from([]));
    } catch (fallbackErr) {
      console.error('Fatal fallback error:', fallbackErr);
    }
    return {
      templateId,
      pngUrl: `/uploads/certificates/${outPngName}`,
      pdfUrl: `/uploads/certificates/${outPdfName}`
    };
  }
};
