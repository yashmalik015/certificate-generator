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

// ── Render Authentic IHREO Vector PDF Base Certificate ───────────────────────
// Directly superimposes text and images on the blank certificate inputs WITHOUT ANY background bars or rectangles
const renderIhreDocPdf = async (studentData, templateId) => {
  let pdfTemplatePath = findTemplateFile(templateId, ['.pdf']) || findTemplateFile('Doctorate IHREO', ['.pdf']);
  if (!pdfTemplatePath || !fs.existsSync(pdfTemplatePath)) {
    throw new Error(`Base PDF template not found for ${templateId}`);
  }

  const baseDoc = await PDFDocument.load(fs.readFileSync(pdfTemplatePath));
  const fontBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await baseDoc.embedFont(StandardFonts.Helvetica);
  const page = baseDoc.getPage(0);
  const { width: cW, height: cH } = page.getSize();

  // 1. Top Left: CIN, Licence No, Sl. No, Reg No (superimposed directly, no background bar)
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${studentData.refno || 'WCAEO/2026/001'}\nReg No. 459383`;
  page.drawText(refText, {
    x: 44,
    y: 785,
    size: 7.5,
    font: fontReg,
    color: rgb(0.12, 0.15, 0.20),
    lineHeight: 10.5
  });

  // 2. Top Right: Verification QR Code (superimposed directly, no background bar)
  try {
    const domain = process.env.APP_BASE_URL || 'https://certificate-generator.vercel.app';
    const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, { x: cW - 132, y: cH - 132, width: 68, height: 68 });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Award Title (superimposed directly on the light ribbon, no background bar)
  const titleStr = getAwardTitle(templateId);
  const tw = fontBold.widthOfTextAtSize(titleStr, 21);
  page.drawText(titleStr, {
    x: (cW - tw) / 2,
    y: 516,
    size: 21,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.28)
  });

  // 4. Recipient Photo (superimposed directly inside center frame, no background bar)
  const pImg = await embedPhoto(baseDoc, studentData);
  if (pImg) {
    page.drawImage(pImg, { x: (cW - 86) / 2, y: 388, width: 86, height: 96 });
  }

  // 5. Recipient Name (superimposed directly on the name ribbon, no background bar)
  const nameStr = (studentData.fullName || 'RECIPIENT NAME').toUpperCase();
  let nameSize = 16;
  while (nameSize > 10 && fontBold.widthOfTextAtSize(nameStr, nameSize) > 360) {
    nameSize -= 0.5;
  }
  const nw = fontBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (cW - nw) / 2,
    y: 288,
    size: nameSize,
    font: fontBold,
    color: rgb(0.06, 0.08, 0.14)
  });

  // 6. Award Category / Distinction (superimposed directly with word-wrap, no background bar)
  const catStr = studentData.category || 'For Outstanding Achievements & Social Excellence';
  const words = catStr.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (fontBold.widthOfTextAtSize(test, 11.5) > cW - 120 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const startY = lines.length === 1 ? 194 : (lines.length === 2 ? 202 : 210);
  lines.forEach((line, i) => {
    const lw = fontBold.widthOfTextAtSize(line, 11.5);
    page.drawText(line, {
      x: (cW - lw) / 2,
      y: startY - (i * 15),
      size: 11.5,
      font: fontBold,
      color: rgb(0.80, 0.10, 0.10)
    });
  });

  // 7. Date of Issue (superimposed directly, no background bar)
  const dateFormatted = studentData.letterIssuedAt
    ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontReg.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, {
    x: (cW - dw) / 2,
    y: 138,
    size: 9.5,
    font: fontReg,
    color: rgb(0.15, 0.18, 0.25)
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
      const verifyUrl = `${domain}/verify/${encodeURIComponent(studentData.certificateNumber || 'INVALID')}`;
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
