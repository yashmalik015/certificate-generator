import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn('Certificates dir setup:', e.message);
}

// ── Colour helpers ──────────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '#000000'));
  return r ? rgb(parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255) : rgb(0, 0, 0);
};

// ── Template list ────────────────────────────────────────────────────────────
export const getAvailableTemplates = () => {
  if (!fs.existsSync(templatesDir)) return [];
  try {
    return fs.readdirSync(templatesDir)
      .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
      .map((filename) => {
        const id = path.basename(filename, path.extname(filename));
        return {
          id,
          filename,
          label: id.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim(),
          hasConfig: fs.existsSync(path.join(configDir, `${id}.json`))
        };
      });
  } catch {
    return [
      { id: 'Bhartiya Samaj Seva award', filename: 'Bhartiya Samaj Seva award.png', label: 'Bhartiya Samaj Seva award', hasConfig: true }
    ];
  }
};

// ── Default field config (used if no JSON config file exists) ────────────────
const defaultConfig = () => ({
  fields: {
    fullName:          { x: 1200, y: 590,  fontSize: 56, font: 'bold', color: '#0f172a', align: 'center', maxWidth: 1800 },
    category:         { x: 1200, y: 760,  fontSize: 34, font: 'bold', color: '#b45309', align: 'center', maxWidth: 1600, wrap: true },
    refno:            { x: 300,  y: 1475, fontSize: 22, font: 'bold', color: '#475569', align: 'left' },
    certificateNumber:{ x: 1200, y: 1475, fontSize: 22, font: 'bold', color: '#475569', align: 'center' },
    letterIssuedAt:   { x: 2100, y: 1475, fontSize: 22, font: 'bold', color: '#475569', align: 'right' }
  },
  photo:  { x: 1080, y: 840, width: 240, height: 240 },
  qrCode: { x: 2050, y: 100, size: 180 }
});

// ── Load config from JSON (or fall back to defaults) ────────────────────────
const loadConfig = (templateId) => {
  const jsonPath = path.join(configDir, `${templateId}.json`);
  if (fs.existsSync(jsonPath)) {
    try { return JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch {}
  }
  return defaultConfig();
};

// ── Draw text with auto-shrink and optional word-wrap ───────────────────────
const drawTextField = (page, text, fieldConfig, pageHeight, font) => {
  if (!text) return;
  const str = String(text);
  const maxWidth = fieldConfig.maxWidth || 0;
  const wrap = Boolean(fieldConfig.wrap);
  const color = hexToRgb(fieldConfig.color);

  // Shrink font size until text fits within maxWidth (single-line fields)
  let fontSize = fieldConfig.fontSize || 24;
  if (maxWidth && !wrap) {
    while (fontSize > 12 && font.widthOfTextAtSize(str, fontSize) > maxWidth) {
      fontSize -= 1;
    }
  }

  // canvas Y (top-left origin) → pdf Y (bottom-left origin)
  const pdfY = pageHeight - fieldConfig.y;

  if (wrap && maxWidth) {
    // Word-wrap into multiple lines
    const words = str.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    const lineHeight = fontSize * 1.3;
    lines.forEach((line, i) => {
      const lw = font.widthOfTextAtSize(line, fontSize);
      let x = fieldConfig.x;
      if (fieldConfig.align === 'center') x = fieldConfig.x - lw / 2;
      else if (fieldConfig.align === 'right') x = fieldConfig.x - lw;
      try {
        page.drawText(line, { x: Math.max(0, x), y: pdfY - i * lineHeight, size: fontSize, font, color });
      } catch {}
    });
  } else {
    const tw = font.widthOfTextAtSize(str, fontSize);
    let x = fieldConfig.x;
    if (fieldConfig.align === 'center') x = fieldConfig.x - tw / 2;
    else if (fieldConfig.align === 'right') x = fieldConfig.x - tw;
    try {
      page.drawText(str, { x: Math.max(0, x), y: pdfY, size: fontSize, font, color });
    } catch {}
  }
};

// ── Embed photo helper ───────────────────────────────────────────────────────
const embedPhoto = async (pdfDoc, studentData) => {
  if (!studentData.photoUrl) return null;
  try {
    let buf = null, isJpeg = false;
    if (studentData.photoUrl.startsWith('data:image/')) {
      buf = Buffer.from(studentData.photoUrl.split(',')[1], 'base64');
      isJpeg = /jpeg|jpg/.test(studentData.photoUrl);
    } else {
      const relPath = studentData.photoUrl.replace(/^\//, '');
      for (const tryPath of [path.join('/tmp', relPath), path.resolve(__dirname, '..', relPath)]) {
        if (fs.existsSync(tryPath)) { buf = fs.readFileSync(tryPath); isJpeg = /\.jpe?g$/i.test(tryPath); break; }
      }
    }
    if (!buf || !buf.length) return null;
    for (const [tryJpeg] of [[isJpeg], [!isJpeg]]) {
      try { return tryJpeg ? await pdfDoc.embedJpg(buf) : await pdfDoc.embedPng(buf); } catch {}
    }
  } catch (e) { console.warn('Photo embed warning:', e.message); }
  return null;
};

// ── Core PDF generator ───────────────────────────────────────────────────────
const buildPdf = async (studentData, templateId, extraValues = {}) => {
  const config = loadConfig(templateId);
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let pageWidth = 2400, pageHeight = 1600;

  // Embed template PNG background
  const pngPath = path.join(templatesDir, `${templateId}.png`);
  if (fs.existsSync(pngPath)) {
    try {
      const buf = fs.readFileSync(pngPath);
      const img = await pdfDoc.embedPng(buf);
      pageWidth = img.width; pageHeight = img.height;
      const pg = pdfDoc.addPage([pageWidth, pageHeight]);
      pg.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
    } catch (e) {
      console.warn(`Template PNG embed warning (${templateId}):`, e.message);
      pdfDoc.addPage([pageWidth, pageHeight]);
    }
  } else {
    console.warn(`⚠ Template PNG not found: ${templateId}.png — using blank canvas`);
    pdfDoc.addPage([pageWidth, pageHeight]);
  }

  const page = pdfDoc.getPage(0);

  // Format date
  const dateFormatted = studentData.letterIssuedAt
    ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const values = {
    fullName:          studentData.fullName || '',
    category:         studentData.category || '',
    refno:            `Ref: ${studentData.refno || ''}`,
    certificateNumber:`Cert No: ${studentData.certificateNumber || ''}`,
    letterIssuedAt:   `Date: ${dateFormatted}`,
    fathersHusbandName: studentData.fathersHusbandName ? `S/D/W of: ${studentData.fathersHusbandName}` : '',
    designation:      studentData.designation || '',
    nationality:      studentData.nationality || '',
    ...extraValues
  };

  // Draw all text fields
  if (config.fields) {
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      const val = values[fieldName];
      if (!val) continue;
      const useFont = String(fieldConfig.font || '').toLowerCase().includes('bold') ? fontBold : fontReg;
      drawTextField(page, val, fieldConfig, pageHeight, useFont);
    }
  }

  // Embed photo
  const photoConfig = config.photo || { x: 1080, y: 840, width: 240, height: 240 };
  const photoImg = await embedPhoto(pdfDoc, studentData);
  if (photoImg) {
    const pdfPhotoY = pageHeight - photoConfig.y - photoConfig.height;
    page.drawImage(photoImg, {
      x: photoConfig.x + 6,
      y: pdfPhotoY + 6,
      width: photoConfig.width - 12,
      height: photoConfig.height - 12
    });
  }

  // Embed QR code
  const qrConfig = config.qrCode || { x: 2050, y: 100, size: 180 };
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator-two-nu.vercel.app';
    const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: qrConfig.size || 180 });
    const qrImg = await pdfDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: qrConfig.x,
      y: pageHeight - qrConfig.y - qrConfig.size,
      width: qrConfig.size,
      height: qrConfig.size
    });
  } catch (e) { console.warn('QR embed warning:', e.message); }

  return await pdfDoc.save();
};

// ── Award Certificate ────────────────────────────────────────────────────────
export const generateCertificate = async (studentData, templateId) => {
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const name = `${sanitize(studentData.refno || 'REF000')}-${sanitize(templateId)}`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  try {
    const pdfBytes = await buildPdf(studentData, templateId);
    fs.writeFileSync(pdfPath, pdfBytes);
    if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
  } catch (err) {
    console.error(`Certificate generation error (${templateId}):`, err);
  }
  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`
  };
};

// ── Universal ID Card ────────────────────────────────────────────────────────
export const generateIdCard = async (studentData) => {
  const templateId = 'universal-id-card';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const name = `${sanitize(studentData.refno || 'REF000')}-id-card`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  try {
    const pdfBytes = await buildPdf(studentData, templateId, {
      designation: studentData.designation || 'Member',
      nationality: studentData.nationality || 'Indian'
    });
    fs.writeFileSync(pdfPath, pdfBytes);
    if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
  } catch (err) {
    console.error('ID Card generation error:', err);
  }
  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`
  };
};

// ── Universal Membership Certificate ────────────────────────────────────────
export const generateMembershipCert = async (studentData) => {
  const templateId = 'universal-membership-certificate';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const name = `${sanitize(studentData.refno || 'REF000')}-membership`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  try {
    const pdfBytes = await buildPdf(studentData, templateId);
    fs.writeFileSync(pdfPath, pdfBytes);
    if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
  } catch (err) {
    console.error('Membership cert generation error:', err);
  }
  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`
  };
};
