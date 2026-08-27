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
    const files = fs.readdirSync(templatesDir);
    return files
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf') || f.endsWith('.jpg'))
      .filter((f) => !f.startsWith('universal-'))
      .map((filename) => {
        const id = path.basename(filename, path.extname(filename));
        return {
          id,
          filename,
          label: id.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim(),
          hasConfig: fs.existsSync(path.join(configDir, `${id}.json`))
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i); // unique by ID
  } catch {
    return [
      { id: 'Doctorate IHREO', filename: 'Doctorate IHREO.pdf', label: 'Doctorate IHREO', hasConfig: true },
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

  let fontSize = fieldConfig.fontSize || 24;
  if (maxWidth && !wrap) {
    while (fontSize > 10 && font.widthOfTextAtSize(str, fontSize) > maxWidth) {
      fontSize -= 1;
    }
  }

  const pdfY = pageHeight - fieldConfig.y;

  if (wrap && maxWidth) {
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

// ── Render Authentic IHREO Vector PDF Base Certificate ───────────────────────
const renderIhreDocPdf = async (studentData, templateId) => {
  const pdfTemplatePath = path.join(templatesDir, 'Doctorate IHREO.pdf');
  const baseDoc = await PDFDocument.load(fs.readFileSync(pdfTemplatePath));
  const fontBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await baseDoc.embedFont(StandardFonts.Helvetica);
  const page = baseDoc.getPage(0);
  const { width: cW, height: cH } = page.getSize();

  // Top Left CIN, Licence & Sl. No.
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${studentData.refno || 'WCAEO/2026/001'}\nReg No. 459383`;
  page.drawText(refText, {
    x: 47, y: cH - 88, size: 7.5, font: fontReg, color: rgb(0.1, 0.1, 0.1), lineHeight: 10
  });

  // Top Right QR Code
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
    const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, { x: cW - 135, y: cH - 135, width: 70, height: 70 });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // Recipient Photo inside Photo Frame
  const pImg = await embedPhoto(baseDoc, studentData);
  if (pImg) {
    page.drawImage(pImg, { x: cW / 2 - 40, y: cH / 2 + 15, width: 80, height: 95 });
  } else {
    // Elegant silhouette placeholder if no photo uploaded
    page.drawRectangle({
      x: cW / 2 - 38, y: cH / 2 + 15, width: 76, height: 90,
      color: rgb(0.94, 0.96, 0.98), borderColor: rgb(0.75, 0.8, 0.85), borderWidth: 1
    });
  }

  // Recipient Name
  const nameStr = (studentData.fullName || 'RECIPIENT NAME').toUpperCase();
  const nw = fontBold.widthOfTextAtSize(nameStr, 15);
  page.drawText(nameStr, { x: (cW - nw) / 2, y: 288, size: 15, font: fontBold, color: rgb(0.05, 0.05, 0.05) });

  // Award Category
  const catStr = studentData.category || 'For Outstanding Achievements & Social Excellence';
  const words = catStr.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if (fontBold.widthOfTextAtSize(l1 + ' ' + w, 11) < cW - 120 && !l2) {
      l1 = l1 ? l1 + ' ' + w : w;
    } else {
      l2 = l2 ? l2 + ' ' + w : w;
    }
  }
  const l1w = fontBold.widthOfTextAtSize(l1, 11);
  page.drawText(l1, { x: (cW - l1w) / 2, y: l2 ? 200 : 192, size: 11, font: fontBold, color: rgb(0.85, 0.1, 0.1) });
  if (l2) {
    const l2w = fontBold.widthOfTextAtSize(l2, 11);
    page.drawText(l2, { x: (cW - l2w) / 2, y: 184, size: 11, font: fontBold, color: rgb(0.85, 0.1, 0.1) });
  }

  // Date of Issue
  const dateFormatted = studentData.letterIssuedAt
    ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontReg.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, { x: (cW - dw) / 2, y: 139, size: 9.5, font: fontReg, color: rgb(0.1, 0.1, 0.1) });

  return await baseDoc.save();
};

// ── Generic PNG Template Builder ─────────────────────────────────────────────
const renderPngTemplate = async (studentData, templateId) => {
  const pngPath = path.join(templatesDir, `${templateId}.png`);
  if (!fs.existsSync(pngPath)) {
    return await renderIhreDocPdf(studentData, templateId);
  }

  const config = loadConfig(templateId);
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const buf = fs.readFileSync(pngPath);
  const img = await pdfDoc.embedPng(buf);
  const pageWidth = img.width;
  const pageHeight = img.height;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });

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
    nationality:      studentData.nationality || ''
  };

  if (config.fields) {
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      const val = values[fieldName];
      if (!val) continue;
      const useFont = String(fieldConfig.font || '').toLowerCase().includes('bold') ? fontBold : fontReg;
      drawTextField(page, val, fieldConfig, pageHeight, useFont);
    }
  }

  const photoConfig = config.photo || { x: 1080, y: 840, width: 240, height: 240 };
  const photoImg = await embedPhoto(pdfDoc, studentData);
  if (photoImg) {
    page.drawImage(photoImg, {
      x: photoConfig.x + 6,
      y: pageHeight - photoConfig.y - photoConfig.height + 6,
      width: photoConfig.width - 12,
      height: photoConfig.height - 12
    });
  }

  const qrConfig = config.qrCode || { x: 2050, y: 100, size: 180 };
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
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
    const pdfTemplatePath = path.join(templatesDir, `${templateId}.pdf`);
    let pdfBytes;
    if (fs.existsSync(pdfTemplatePath) || templateId.includes('Doctorate') || templateId.includes('IHREO')) {
      pdfBytes = await renderIhreDocPdf(studentData, templateId);
    } else {
      pdfBytes = await renderPngTemplate(studentData, templateId);
    }
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
    const idTemplatePath = path.join(templatesDir, 'universal-id-card.pdf');
    const baseDoc = await PDFDocument.load(fs.readFileSync(idTemplatePath));
    const fontBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
    const page = baseDoc.getPage(0);
    const { width: idW, height: idH } = page.getSize();

    // Reg No & Sl No in top black bar
    page.drawText(`Reg No. 459383`, { x: 15, y: idH - 18, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(`Sl. No. ${studentData.refno || '459383/IHREO0208'}`, { x: 130, y: idH - 18, size: 10, font: fontBold, color: rgb(1, 1, 1) });

    // Top Right QR Code
    try {
      const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
      const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 100 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: idW - 48, y: idH - 58, width: 32, height: 32 });
    } catch {}

    // Recipient Photo inside left frame
    const pImg = await embedPhoto(baseDoc, studentData);
    if (pImg) {
      page.drawImage(pImg, { x: 15, y: 36, width: 38, height: 48 });
    }

    // Dynamic Fields (Name, Designation, Nationality, Date)
    const dateFormatted = studentData.letterIssuedAt
      ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    page.drawText(studentData.fullName || 'Member Name', { x: 114, y: 70, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(studentData.designation || 'National Member', { x: 114, y: 58, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(studentData.nationality || 'Indian', { x: 114, y: 46, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(dateFormatted, { x: 114, y: 35, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    const pdfBytes = await baseDoc.save();
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
    const memTemplatePath = path.join(templatesDir, 'universal-membership-certificate.pdf');
    const baseDoc = await PDFDocument.load(fs.readFileSync(memTemplatePath));
    const fontBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await baseDoc.embedFont(StandardFonts.Helvetica);
    const page = baseDoc.getPage(0);
    const { width: mW, height: mH } = page.getSize();

    // Top Left CIN, Licence & Sl. No.
    const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${studentData.refno || 'WCAEO/2026/001'}\nReg No. 459383`;
    page.drawText(refText, {
      x: 52, y: mH - 105, size: 7.5, font: fontReg, color: rgb(0.1, 0.1, 0.1), lineHeight: 10
    });

    // Top Right QR Code
    try {
      const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
      const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: mW - 145, y: mH - 145, width: 70, height: 70 });
    } catch {}

    // Center Recipient Photo
    const pImg = await embedPhoto(baseDoc, studentData);
    if (pImg) {
      page.drawImage(pImg, { x: mW / 2 - 40, y: 395, width: 80, height: 100 });
    } else {
      page.drawRectangle({
        x: mW / 2 - 38, y: 395, width: 76, height: 95,
        color: rgb(0.94, 0.96, 0.98), borderColor: rgb(0.75, 0.8, 0.85), borderWidth: 1
      });
    }

    // Recipient Name
    const nameStr = (studentData.fullName || 'MEMBER NAME').toUpperCase();
    const nw = fontBold.widthOfTextAtSize(nameStr, 15);
    page.drawText(nameStr, { x: (mW - nw) / 2, y: 275, size: 15, font: fontBold, color: rgb(0.05, 0.05, 0.05) });

    // Date of Issue
    const dateFormatted = studentData.letterIssuedAt
      ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const dateStr = `Date of Issue : ${dateFormatted}`;
    const dw = fontReg.widthOfTextAtSize(dateStr, 9.5);
    page.drawText(dateStr, { x: (mW - dw) / 2, y: 172, size: 9.5, font: fontReg, color: rgb(0.1, 0.1, 0.1) });

    const pdfBytes = await baseDoc.save();
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
