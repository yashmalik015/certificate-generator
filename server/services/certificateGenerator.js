import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);

// Resolve templates directory reliably across local dev and Vercel serverless environments
const possibleTemplatesDirs = [
  path.resolve(__dirname, '../../src/assets/certificate-templates'),
  path.join(process.cwd(), 'src/assets/certificate-templates'),
  path.join(process.cwd(), 'CertificateWeb/src/assets/certificate-templates'),
  path.resolve(__dirname, '../../src/assets'),
  path.join(process.cwd(), 'src/assets'),
  path.join(process.cwd(), 'CertificateWeb/src/assets')
];

export const getTemplatesDir = () => {
  const found = possibleTemplatesDirs.find((d) => fs.existsSync(d) && fs.readdirSync(d).length > 0);
  return found || possibleTemplatesDirs[0];
};

const templatesDir = getTemplatesDir();
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

// ── Friendly Award Titles ────────────────────────────────────────────────────
export const getAwardTitle = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('doctorate')) return 'Honorary Doctorate Award';
  if (lower.includes('samaj') || lower.includes('seva award')) return 'Bhartiya Samaj Seva Award';
  if (lower.includes('padm') || lower.includes('bhushan')) return 'Bhartiya Padma Bhushan Samman';
  if (lower.includes('business')) return 'International Business Excellence Award';
  if (lower.includes('enterpreneur') || lower.includes('entrepreneur')) return 'International Best Entrepreneur Award';
  if (lower.includes('lifetime') || lower.includes('literary')) return 'Lifetime Literary Achievement Award';
  if (lower.includes('sahitya')) return 'Sahitya Sewa Ratna Sammaan';
  if (lower.includes('shiksha') || lower.includes('principal')) return 'Shiksha Ratna Principal Award';
  if (lower.includes('bibhuti')) return 'Bibhuti Puraskar';
  if (lower.includes('laureate')) return 'Laureate Award Certificate';
  if (lower.includes('women') || lower.includes('icon')) return 'Women Icon Award';
  return templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// ── Template list ────────────────────────────────────────────────────────────
export const getAvailableTemplates = () => {
  const tDir = getTemplatesDir();
  if (!fs.existsSync(tDir)) return [];
  try {
    const files = fs.readdirSync(tDir);
    return files
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf') || f.endsWith('.jpg'))
      .filter((f) => !f.startsWith('universal-') && !f.includes('SANDHYA') && !f.includes('KAWALJEET') && !f.includes('MEHA'))
      .map((filename) => {
        const id = path.basename(filename, path.extname(filename));
        return {
          id,
          filename,
          label: getAwardTitle(id),
          hasConfig: true
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  } catch {
    return [
      { id: 'Doctorate IHREO', filename: 'Doctorate IHREO.pdf', label: 'Honorary Doctorate Award', hasConfig: true },
      { id: 'Bhartiya Samaj Seva award', filename: 'Bhartiya Samaj Seva award.pdf', label: 'Bhartiya Samaj Seva Award', hasConfig: true },
      { id: 'rashtriya padma bhushan samman', filename: 'rashtriya padma bhushan samman.pdf', label: 'Bhartiya Padma Bhushan Samman', hasConfig: true },
      { id: 'women icon award', filename: 'women icon award.pdf', label: 'Women Icon Award', hasConfig: true }
    ];
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
      const tryPaths = [
        path.join('/tmp', relPath),
        path.resolve(__dirname, '..', relPath),
        path.join(process.cwd(), relPath),
        path.join(process.cwd(), 'CertificateWeb', relPath)
      ];
      for (const tryPath of tryPaths) {
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

// ── Find Template File Helper ────────────────────────────────────────────────
const findTemplateFile = (baseName, extensions = ['.pdf', '.png', '.jpg']) => {
  const tDir = getTemplatesDir();
  const searchDirs = [
    tDir,
    path.resolve(__dirname, '../../src/assets'),
    path.join(process.cwd(), 'src/assets'),
    path.join(process.cwd(), 'CertificateWeb/src/assets')
  ];
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const ext of extensions) {
      const p = path.join(dir, `${baseName}${ext}`);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
};

// ── Render Authentic IHREO Vector PDF Base Certificate (Clean Superimposition) ──
export const renderIhreDocPdf = async (studentData, templateId) => {
  let pdfTemplatePath = findTemplateFile(templateId, ['.pdf']) || findTemplateFile('Doctorate IHREO', ['.pdf']);
  if (!pdfTemplatePath || !fs.existsSync(pdfTemplatePath)) {
    throw new Error(`Base PDF template not found for ${templateId}`);
  }

  const baseDoc = await PDFDocument.load(fs.readFileSync(pdfTemplatePath));
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const page = baseDoc.getPage(0);
  const { width: cW } = page.getSize();

  // 1. Top Left CIN, Licence & Sl. No., Reg No. (Clean Superimposition)
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${studentData.refno || '459383/IHREO0201'}\nReg No. 459383`;
  page.drawText(refText, {
    x: 65, y: 775, size: 7.5, font: fontHelv, color: rgb(0.12, 0.12, 0.12), lineHeight: 10
  });

  // 2. Top Right QR Code (Clean Superimposition with ?cert= universal routing)
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, { x: 450, y: 715, width: 72, height: 72 });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Award Title inside Top Capsule (Clean Serif Typography, Perfectly Centered)
  const titleStr = getAwardTitle(templateId);
  const tw = fontTimes.widthOfTextAtSize(titleStr, 23.5);
  page.drawText(titleStr, {
    x: (cW - tw) / 2,
    y: 504,
    size: 23.5,
    font: fontTimes,
    color: rgb(0.1, 0.1, 0.1)
  });

  // 4. Recipient Photo inside Center Slot between Graduation Caps
  const pImg = await embedPhoto(baseDoc, studentData);
  if (pImg) {
    page.drawImage(pImg, { x: 253.66, y: 377.78, width: 88.01, height: 95.05 });
  }

  // 5. Recipient Name inside Bottom Capsule (Clean Serif Typography, Perfectly Centered)
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 16.5;
  while (nameSize > 9 && fontTimes.widthOfTextAtSize(nameStr, nameSize) > 310) {
    nameSize -= 0.5;
  }
  const nw = fontTimes.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (cW - nw) / 2,
    y: 280,
    size: nameSize,
    font: fontTimes,
    color: rgb(0.1, 0.1, 0.1)
  });

  // 6. Award Category (Bold Crimson Red in Dedicated Space below "he/she is hereby awarded")
  const catStr = studentData.category || 'For Outstanding Distinction & Excellence';
  const words = catStr.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if (fontTimesBold.widthOfTextAtSize(l1 + ' ' + w, 13.5) < cW - 120 && !l2) {
      l1 = l1 ? l1 + ' ' + w : w;
    } else {
      l2 = l2 ? l2 + ' ' + w : w;
    }
  }
  const l1w = fontTimesBold.widthOfTextAtSize(l1, 13.5);
  page.drawText(l1, {
    x: (cW - l1w) / 2,
    y: l2 ? 202 : 196,
    size: 13.5,
    font: fontTimesBold,
    color: rgb(0.8, 0.15, 0.15)
  });
  if (l2) {
    const l2w = fontTimesBold.widthOfTextAtSize(l2, 13.5);
    page.drawText(l2, {
      x: (cW - l2w) / 2,
      y: 186,
      size: 13.5,
      font: fontTimesBold,
      color: rgb(0.8, 0.15, 0.15)
    });
  }

  // 7. "Honoris causa with all rights and privileges there into pertaining"
  const honorisText = 'Honoris causa with all rights and privileges there into pertaining';
  const hw = fontTimes.widthOfTextAtSize(honorisText, 10.5);
  page.drawText(honorisText, {
    x: (cW - hw) / 2,
    y: 176,
    size: 10.5,
    font: fontTimes,
    color: rgb(0.15, 0.15, 0.15)
  });

  // 8. Date of Issue centered above bottom logos
  const dateFormatted = studentData.letterIssuedAt
    ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontHelv.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, {
    x: (cW - dw) / 2,
    y: 138,
    size: 9.5,
    font: fontHelv,
    color: rgb(0.12, 0.12, 0.12)
  });

  return await baseDoc.save();
};

// ── Award Certificate ────────────────────────────────────────────────────────
export const generateCertificate = async (studentData, templateId) => {
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const name = `${sanitize(studentData.refno || 'REF000')}-${sanitize(templateId)}`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  try {
    const pdfBytes = await renderIhreDocPdf(studentData, templateId);
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
    const idTemplatePath = findTemplateFile('universal-id-card', ['.pdf']) || path.join(templatesDir, 'universal-id-card.pdf');
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
      const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
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
    const memTemplatePath = findTemplateFile('universal-membership-certificate', ['.pdf']) || path.join(templatesDir, 'universal-membership-certificate.pdf');
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
      const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: mW - 145, y: mH - 145, width: 70, height: 70 });
    } catch {}

    // Center Recipient Photo
    const pImg = await embedPhoto(baseDoc, studentData);
    if (pImg) {
      page.drawImage(pImg, { x: mW / 2 - 40, y: 395, width: 80, height: 100 });
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
