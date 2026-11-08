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
  path.join(process.cwd(), 'CertificateWeb/src/assets'),
  path.resolve(__dirname, '../../public/assets/certificate-templates'),
  path.join(process.cwd(), 'public/assets/certificate-templates')
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

// ── Resolve live app base domain ───────────────────────────────────────────
export const resolveAppDomain = (customDomain) => {
  if (customDomain && typeof customDomain === 'string' && !customDomain.includes('localhost:5050')) {
    return customDomain.replace(/\/+$/, '');
  }
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  return 'https://certificate-generator-yashmalik015-6612s-projects.vercel.app';
};

// ── Friendly Award Titles & Categories ──────────────────────────────────────
export const getAwardTitle = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('padma')) return 'Bhartiya Padma Bhushan Samman';
  if (lower.includes('doctorate')) return 'Honorary Doctorate Award';
  if (lower.includes('membership')) return 'Certificate of Lifetime Membership';
  if (lower.includes('id-card') || lower.includes('id card')) return 'Universal ID Card';
  return templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getAwardCategory = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('padma')) return 'Academic & Honorary';
  if (lower.includes('doctorate')) return 'Academic & Honorary';
  if (lower.includes('membership')) return 'Membership';
  if (lower.includes('id-card') || lower.includes('id card')) return 'Identity Card';
  return 'Official Documents';
};

// ── Curated Authentic Template List (Padma Bhushan, Doctorate IHREO, Lifetime Membership, ID Card) ──
export const getAvailableTemplates = () => {
  return [
    {
      id: 'Bhartiya Padma Bhushan Samman',
      filename: 'Bhartiya Padma Bhushan Samman.pdf',
      label: 'Bhartiya Padma Bhushan Samman',
      category: 'Academic & Honorary',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Bhartiya%20Padma%20Bhushan%20Samman.png'
    },
    {
      id: 'Doctorate IHREO',
      filename: 'Doctorate IHREO.pdf',
      label: 'Honorary Doctorate Award',
      category: 'Academic & Honorary',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Doctorate%20IHREO.png'
    },
    {
      id: 'universal-membership-certificate',
      filename: 'universal-membership-certificate.pdf',
      label: 'Certificate of Lifetime Membership',
      category: 'Membership',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/universal-membership-certificate.png'
    },
    {
      id: 'universal-id-card',
      filename: 'universal-id-card.pdf',
      label: 'Universal ID Card',
      category: 'Identity Card',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/universal-id-card.png'
    }
  ];
};

// ── Robust Photo Fetcher Helper ───────────────────────────────────────────────
const getPhotoBuffer = async (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') return null;
  const trimmed = photoUrl.trim();

  // 1. Data URI / Base64 format
  if (trimmed.startsWith('data:')) {
    try {
      const commaIdx = trimmed.indexOf(',');
      const b64 = commaIdx !== -1 ? trimmed.slice(commaIdx + 1) : trimmed;
      const cleanB64 = decodeURIComponent(b64).replace(/\s+/g, '').replace(/ /g, '+');
      return Buffer.from(cleanB64, 'base64');
    } catch (e) {
      console.warn('Base64 parse warning:', e.message);
    }
  }

  // 2. Raw Base64 string
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed.slice(0, 200))) {
    try {
      return Buffer.from(trimmed.replace(/\s+/g, '').replace(/ /g, '+'), 'base64');
    } catch {}
  }

  // 3. HTTP / HTTPS Remote URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(trimmed, { responseType: 'arraybuffer', timeout: 8000 });
      if (res.data) return Buffer.from(res.data);
    } catch (netErr) {
      console.warn('Remote photo fetch warning:', netErr.message);
    }
  }

  // 4. Local filesystem paths
  const relPath = trimmed.replace(/^\//, '');
  const candidatePaths = [
    trimmed,
    path.join('/tmp', relPath),
    path.resolve(__dirname, '..', relPath),
    path.resolve(__dirname, '../uploads/photos', path.basename(trimmed)),
    path.join(process.cwd(), relPath),
    path.join(process.cwd(), 'server', relPath),
    path.join(process.cwd(), 'CertificateWeb', relPath),
    path.join(process.cwd(), 'CertificateWeb/server', relPath)
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        if (stats.isFile() && stats.size > 0) {
          return fs.readFileSync(p);
        }
      }
    } catch {}
  }

  return null;
};

// ── Embed photo helper with shape masking (rect / circle) ───────────────────
const embedPhotoWithShape = async (pdfDoc, studentData, shape = 'rect', borderColor = '#222222', borderWidth = 1.5, targetWidth = 300, targetHeight = 300) => {
  if (!studentData.photoUrl) return null;
  try {
    const rawBuf = await getPhotoBuffer(studentData.photoUrl);
    if (!rawBuf || !rawBuf.length) return null;

    try {
      const { createCanvas, loadImage } = await import('canvas');
      const img = await loadImage(rawBuf);
      const w = img.width || 400;
      const h = img.height || 400;
      const canvas = createCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');

      const bw = Math.max(0, borderWidth);

      if (shape === 'circle') {
        const radius = Math.min(targetWidth, targetHeight) / 2 - bw;
        const cx = targetWidth / 2;
        const cy = targetHeight / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.save();
        ctx.clip();

        // Fit photo inside circle
        const minDim = Math.min(w, h);
        const sx = (w - minDim) / 2;
        const sy = (h - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, bw, bw, targetWidth - bw * 2, targetHeight - bw * 2);
        ctx.restore();

        if (bw > 0) {
          ctx.lineWidth = bw * 2;
          ctx.strokeStyle = borderColor;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        const radius = 6;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bw, bw, targetWidth - bw * 2, targetHeight - bw * 2, radius);
        } else {
          ctx.rect(bw, bw, targetWidth - bw * 2, targetHeight - bw * 2);
        }
        ctx.closePath();
        ctx.save();
        ctx.clip();

        // Cover fit inside photo frame
        const imgAspect = w / h;
        const targetAspect = (targetWidth - bw * 2) / (targetHeight - bw * 2);
        let drawW, drawH, drawX, drawY;
        if (imgAspect > targetAspect) {
          drawH = targetHeight - bw * 2;
          drawW = drawH * imgAspect;
          drawX = bw + (targetWidth - bw * 2 - drawW) / 2;
          drawY = bw;
        } else {
          drawW = targetWidth - bw * 2;
          drawH = drawW / imgAspect;
          drawX = bw;
          drawY = bw + (targetHeight - bw * 2 - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        if (bw > 0) {
          ctx.lineWidth = bw * 2;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }

      const pngBuf = canvas.toBuffer('image/png');
      return await pdfDoc.embedPng(pngBuf);
    } catch (canvasErr) {
      console.warn('Canvas photo masking fallback:', canvasErr.message);
      if (rawBuf[0] === 0xFF && rawBuf[1] === 0xD8) {
        return await pdfDoc.embedJpg(rawBuf);
      } else {
        return await pdfDoc.embedPng(rawBuf);
      }
    }
  } catch (e) {
    console.error('Photo embed error:', e.message);
  }
  return null;
};

// ── Find Template File Helper ────────────────────────────────────────────────
const findTemplateFile = (baseName, extensions = ['.pdf', '.png', '.jpg']) => {
  const tDir = getTemplatesDir();
  const searchDirs = [
    tDir,
    path.resolve(__dirname, '../../src/assets/certificate-templates'),
    path.resolve(__dirname, '../../public/assets/certificate-templates'),
    path.resolve(__dirname, '../../src/assets'),
    path.join(process.cwd(), 'src/assets/certificate-templates'),
    path.join(process.cwd(), 'public/assets/certificate-templates')
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

// ── Format Date Helper ───────────────────────────────────────────────────────
const formatIssueDate = (dateVal, format = 'DD-MM-YYYY') => {
  const d = dateVal ? new Date(dateVal) : new Date();
  if (isNaN(d.getTime())) return String(dateVal || '');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'DD/MM/YY') {
    return `${day}/${month}/${String(year).slice(-2)}`;
  }
  if (format === 'DD-MMM-YYYY') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${year}`;
  }
  return `${day}-${month}-${year}`;
};

// ── 1. Render Honorary Doctorate Award (Doctorate IHREO) ─────────────────────
const renderDoctorateAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: cW } = page.getSize();
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/040').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');

  // Top Left CIN, Licence & Sl. No., Reg No.
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${cleanRefno}\nReg No. 459383`;
  page.drawText(refText, {
    x: 65,
    y: 775,
    size: 7.5,
    font: fontHelv,
    color: rgb(0.12, 0.12, 0.12),
    lineHeight: 10
  });

  // Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 450,
      y: 715,
      width: 72,
      height: 72
    });
  } catch (qrErr) {}

  // Award Title inside Top Capsule
  const titleStr = 'Honorary Doctorate Award';
  const tw = fontTimes.widthOfTextAtSize(titleStr, 23.5);
  page.drawText(titleStr, {
    x: (cW - tw) / 2,
    y: 504,
    size: 23.5,
    font: fontTimes,
    color: rgb(0.1, 0.1, 0.1)
  });

  // Recipient Photo inside Center Slot between Graduation Caps
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#222222', 1.5, 300, 340);
  if (pImg) {
    page.drawImage(pImg, {
      x: 253.66,
      y: 377.78,
      width: 88.01,
      height: 95.05
    });
  }

  // Recipient Name inside Bottom Capsule
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

  // Award Category
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

  // Honoris causa
  const honorisText = 'Honoris causa with all rights and privileges there into pertaining';
  const hw = fontTimes.widthOfTextAtSize(honorisText, 10.5);
  page.drawText(honorisText, {
    x: (cW - hw) / 2,
    y: 176,
    size: 10.5,
    font: fontTimes,
    color: rgb(0.15, 0.15, 0.15)
  });

  // Date of Issue
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontHelv.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, {
    x: (cW - dw) / 2,
    y: 138,
    size: 9.5,
    font: fontHelv,
    color: rgb(0.12, 0.12, 0.12)
  });
};










// ── 2. Render Bhartiya Padma Bhushan Samman ────────────────────────────────
const renderPadmaBhushan = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW } = page.getSize();
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);

  const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
  const licenceNo = studentData.licence_no || '176566';
  const regNo = studentData.reg_no || '459383';

  // Format serial number
  let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0216';
  let formattedSlNo = String(rawSlNo).trim();
  if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
    formattedSlNo = `459383/${formattedSlNo}`;
  }

  // Certificate number for QR code verification
  const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left 4 Lines (exact vector coordinates from reference PDF)
  const fontSize = 10.86;
  const textColor = rgb(0.08, 0.08, 0.08);

  page.drawText(`CIN NO:- ${cinNo}`, { x: 66.0, y: 768.12, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Licence No:- ${licenceNo}`, { x: 66.0, y: 755.83, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Sl. No. ${formattedSlNo}`, { x: 66.0, y: 743.43, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Reg No. ${regNo}`, { x: 66.0, y: 730.71, size: fontSize, font: fontHelv, color: textColor });

  // 2. Top Right Dynamic QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 250, errorCorrectionLevel: 'M' });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 478.22,
      y: 718.81,
      width: 61.94,
      height: 61.94
    });
  } catch (qrErr) {
    console.warn('QR code generation warning:', qrErr.message);
  }

  // 3. Recipient Photo inside original rounded rectangular gold frame
  // Frame bounds: width 108.86, height 115.66, x: 243.42, y: 252.10
  // Corner radius: 11.84 pt, border 2.0 pt in gold color (#754805)
  const targetW = 108.86;
  const targetH = 115.66;
  const photoBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo);
  if (photoBuf && photoBuf.length > 0) {
    try {
      const { createCanvas, loadImage } = await import('canvas');
      const rawPhoto = await loadImage(photoBuf);
      const scale = 4;
      const cW = Math.round(targetW * scale);
      const cH = Math.round(targetH * scale);
      const canvas = createCanvas(cW, cH);
      const ctx = canvas.getContext('2d');
      const radius = 11.84 * scale;
      const bw = 2.0 * scale;

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, cW, cH, radius);
      else ctx.rect(0, 0, cW, cH);
      ctx.clip();

      const imgAspect = (rawPhoto.width || 400) / (rawPhoto.height || 400);
      const frameAspect = cW / cH;
      let dW, dH, dX, dY;
      if (imgAspect > frameAspect) {
        dH = cH;
        dW = dH * imgAspect;
        dX = (cW - dW) / 2;
        dY = 0;
      } else {
        dW = cW;
        dH = dW / imgAspect;
        dX = 0;
        dY = (cH - dH) / 2;
      }
      ctx.drawImage(rawPhoto, dX, dY, dW, dH);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bw / 2, bw / 2, cW - bw, cH - bw, radius - bw / 2);
      else ctx.rect(bw / 2, bw / 2, cW - bw, cH - bw);
      ctx.lineWidth = bw;
      ctx.strokeStyle = '#754805';
      ctx.stroke();
      ctx.restore();

      const photoPng = await baseDoc.embedPng(canvas.toBuffer('image/png'));
      page.drawImage(photoPng, {
        x: 243.42,
        y: 252.10,
        width: targetW,
        height: targetH
      });
    } catch (photoErr) {
      console.warn('Padma photo embedding error:', photoErr.message);
    }
  }

  // 4. Recipient Name
  const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
  let nameSize = 20.5;
  while (nameSize > 10 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 380) {
    nameSize -= 0.5;
  }
  const nameW = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nameW) / 2,
    y: 228.00,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.08, 0.08, 0.08)
  });

  // 5. Issue Date
  const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
  const dateFormatted = formatIssueDate(rawDate, 'DD-MM-YYYY');
  page.drawText(dateFormatted, {
    x: 295.5,
    y: 129.5,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// ── Master Dispatcher: Render PDF ───────────────────────────────────────────
export const renderIhreDocPdf = async (studentData, templateId, customDomain) => {
  let pdfTemplatePath = findTemplateFile(templateId, ['.pdf', '.png']) || findTemplateFile('Doctorate IHREO', ['.pdf']);
  if (!pdfTemplatePath || !fs.existsSync(pdfTemplatePath)) {
    throw new Error(`Base PDF template not found for ${templateId}`);
  }

  const existingPdfBytes = fs.readFileSync(pdfTemplatePath);
  let baseDoc;

  if (pdfTemplatePath.endsWith('.png') || pdfTemplatePath.endsWith('.jpg')) {
    baseDoc = await PDFDocument.create();
    const imgBytes = fs.readFileSync(pdfTemplatePath);
    const embeddedImg = pdfTemplatePath.endsWith('.png') ? await baseDoc.embedPng(imgBytes) : await baseDoc.embedJpg(imgBytes);
    const page = baseDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
  } else {
    baseDoc = await PDFDocument.load(existingPdfBytes);
  }

  const page = baseDoc.getPage(0);
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('padma')) {
    await renderPadmaBhushan(baseDoc, page, studentData, customDomain);
  } else {
    await renderDoctorateAward(baseDoc, page, studentData, customDomain);
  }
  return await baseDoc.save();
};

// ── Award Certificate Generator (PDF + PNG) ──────────────────────────────────
export const generateCertificate = async (studentData, templateId, customDomain) => {
  if (templateId === 'universal-id-card') {
    return await generateIdCard(studentData, customDomain);
  }
  if (templateId === 'universal-membership-certificate') {
    return await generateMembershipCert(studentData, customDomain);
  }

  if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
  }

  const rawCertNo = studentData.refno || studentData.registrationNumber || studentData.enrollmentNumber || 'CERT';
  const certNumber = String(rawCertNo).replace(/[\/\s:\\]/g, '_');
  const cleanId = String(templateId || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
  const name = `${certNumber}-${cleanId}`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  let pdfBytes = null;

  try {
    pdfBytes = await renderIhreDocPdf(studentData, templateId, customDomain);
    fs.writeFileSync(pdfPath, pdfBytes);

    // Also generate PNG representation for instant web preview
    try {
      const isPadma = String(templateId || '').toLowerCase().includes('padma');
      const basePngPath = findTemplateFile(templateId, ['.png']) || (isPadma ? findTemplateFile('Bhartiya Padma Bhushan Samman', ['.png']) : findTemplateFile('Doctorate IHREO', ['.png']));
      if (basePngPath && fs.existsSync(basePngPath)) {
        const { createCanvas, loadImage } = await import('canvas');
        const bgImg = await loadImage(basePngPath);

        if (isPadma) {
          const canvas = createCanvas(bgImg.width, bgImg.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bgImg, 0, 0);

          const scaleX = bgImg.width / 597.20;
          const scaleY = bgImg.height / 843.92;

          const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
          const licNo = studentData.licence_no || '176566';
          const regNo = studentData.reg_no || '459383';
          let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0216';
          let formattedSlNo = String(rawSlNo).trim();
          if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
            formattedSlNo = `459383/${formattedSlNo}`;
          }

          // Top Left
          ctx.fillStyle = '#111827';
          const fontSizePx = Math.round(10.86 * scaleX);
          ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`CIN NO:- ${cinNo}`, 66.0 * scaleX, (843.92 - 768.12) * scaleY);
          ctx.fillText(`Licence No:- ${licNo}`, 66.0 * scaleX, (843.92 - 755.83) * scaleY);
          ctx.fillText(`Sl. No. ${formattedSlNo}`, 66.0 * scaleX, (843.92 - 743.43) * scaleY);
          ctx.fillText(`Reg No. ${regNo}`, 66.0 * scaleX, (843.92 - 730.71) * scaleY);

          // Top Right QR
          const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');
          const domain = resolveAppDomain(customDomain);
          const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
          const qrBuf = await QRCode.toBuffer(verifyUrl, { margin: 1, width: Math.round(61.94 * scaleX) });
          const qrImg = await loadImage(qrBuf);
          ctx.drawImage(qrImg, 478.22 * scaleX, (843.92 - 718.81 - 61.94) * scaleY, 61.94 * scaleX, 61.94 * scaleY);

          // Recipient Photo
          const rawBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo);
          if (rawBuf) {
            const photo = await loadImage(rawBuf);
            const pX = 243.42 * scaleX;
            const pY = (843.92 - 252.10 - 115.66) * scaleY;
            const pW = 108.86 * scaleX;
            const pH = 115.66 * scaleY;
            const radius = 11.84 * scaleX;
            const bw = 2.0 * scaleX;

            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pX, pY, pW, pH, radius);
            else ctx.rect(pX, pY, pW, pH);
            ctx.clip();

            const imgAspect = (photo.width || 400) / (photo.height || 400);
            const frameAspect = pW / pH;
            let dW, dH, dX, dY;
            if (imgAspect > frameAspect) {
              dH = pH;
              dW = dH * imgAspect;
              dX = pX + (pW - dW) / 2;
              dY = pY;
            } else {
              dW = pW;
              dH = dW / imgAspect;
              dX = pX;
              dY = pY + (pH - dH) / 2;
            }
            ctx.drawImage(photo, dX, dY, dW, dH);
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pX + bw/2, pY + bw/2, pW - bw, pH - bw, radius - bw/2);
            else ctx.rect(pX + bw/2, pY + bw/2, pW - bw, pH - bw);
            ctx.lineWidth = bw;
            ctx.strokeStyle = '#754805';
            ctx.stroke();
            ctx.restore();
          }

          // Recipient Name with controlled scaling
          const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
          ctx.textAlign = 'center';
          let namePx = Math.round(20.5 * scaleX);
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          while (namePx > Math.round(9 * scaleX) && ctx.measureText(nameStr).width > 380 * scaleX) {
            namePx -= 1;
            ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          }
          ctx.fillStyle = '#111827';
          ctx.fillText(nameStr, bgImg.width / 2, (843.92 - 228.00) * scaleY);

          // Issue Date
          const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
          const dateFormatted = formatIssueDate(rawDate, 'DD-MM-YYYY');
          ctx.textAlign = 'left';
          ctx.font = `${Math.round(10.5 * scaleX)}px Arial, Helvetica, sans-serif`;
          ctx.fillStyle = '#1f2937';
          ctx.fillText(dateFormatted, 295.5 * scaleX, (843.92 - 129.5) * scaleY);

          fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
        } else {
          const scale = 2;
          const canvas = createCanvas(bgImg.width * scale, bgImg.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(bgImg, 0, 0);

          const recipientName = (studentData.fullName || 'Recipient Name').toUpperCase();
          const category = studentData.category || 'For Outstanding Distinction & Excellence';
          const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
          const cleanRefno = String(studentData.refno || 'IHREO/2026/040').replace(/WCAEO/gi, 'IHREO');
          const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');

          // Top Left Reference Text
          const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${cleanRefno}\nReg No. 459383`;
          ctx.textAlign = 'left';
          ctx.font = '7.5px Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          const lines = refText.split('\n');
          lines.forEach((line, i) => {
            ctx.fillText(line, 65, 55 + (i * 10));
          });

          // Photo inside center frame
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              const picX = 254;
              const picY = 369;
              const picW = 88;
              const picH = 95;
              ctx.save();
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(picX, picY, picW, picH, 6);
              } else {
                ctx.rect(picX, picY, picW, picH);
              }
              ctx.clip();
              ctx.drawImage(pImg, picX, picY, picW, picH);
              ctx.restore();
              ctx.strokeStyle = '#222222';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          // Recipient Name inside Name Capsule
          ctx.textAlign = 'center';
          ctx.font = 'bold 16.5px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(studentData.fullName || 'Recipient Name', bgImg.width / 2, 562);

          // Category
          ctx.font = 'bold 13.5px "Times New Roman", serif';
          ctx.fillStyle = '#cc2020';
          ctx.fillText(category, bgImg.width / 2, 642);

          // Date of Issue
          ctx.font = '9.5px Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(`Date of Issue : ${dateFormatted}`, bgImg.width / 2, 704);
          fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
        }
      } else {
        if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
      }
    } catch (pngErr) {
      console.warn('PNG generation warning:', pngErr.message);
      if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
    }
  } catch (err) {
    console.error(`Certificate generation error (${templateId}):`, err);
  }

  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`,
    pdfBytes
  };
};

// ── Universal ID Card ────────────────────────────────────────────────────────
export const generateIdCard = async (studentData, customDomain) => {
  const templateId = 'universal-id-card';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_040').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRef.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-id-card`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  let pdfBytes = null;
  try {
    const idTemplatePath = findTemplateFile('universal-id-card', ['.pdf']) || path.join(templatesDir, 'universal-id-card.pdf');
    const baseDoc = await PDFDocument.load(fs.readFileSync(idTemplatePath));
    const fontBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
    const page = baseDoc.getPage(0);

    // 1. Sl No in top black bar
    page.drawText(`Sl. No. ${cleanRef}`, { x: 130, y: 126.5, size: 9.5, font: fontBold, color: rgb(1, 1, 1) });

    // 2. Top Right QR Code
    try {
      const domain = resolveAppDomain(customDomain);
      const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 100 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: 227.72, y: 85.90, width: 28.35, height: 28.35 });
    } catch (qrErr) {
      console.warn('ID Card QR Code error:', qrErr.message);
    }

    // 3. Recipient Photo inside left frame
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#333333', 1, 200, 240);
    if (pImg) {
      page.drawImage(pImg, { x: 14.41, y: 38.12, width: 37.71, height: 41.59 });
    }

    // 4. Dynamic Fields (Name, Designation, Nationality, Date)
    const dateFormatted = studentData.letterIssuedAt
      ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    page.drawText(`: ${studentData.fullName || 'Member Name'}`, { x: 114, y: 70, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${studentData.designation || 'National Member'}`, { x: 114, y: 58, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${studentData.nationality || 'Indian'}`, { x: 114, y: 46, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${dateFormatted}`, { x: 114, y: 35, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    pdfBytes = await baseDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
  } catch (err) {
    console.error('ID Card generation error:', err);
  }
  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`,
    pdfBytes
  };
};

// ── Universal Membership Certificate ────────────────────────────────────────
export const generateMembershipCert = async (studentData, customDomain) => {
  const templateId = 'universal-membership-certificate';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_040').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRef.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0040').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-membership`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  let pdfBytes = null;
  try {
    const memTemplatePath = findTemplateFile('universal-membership-certificate', ['.pdf']) || path.join(templatesDir, 'universal-membership-certificate.pdf');
    const baseDoc = await PDFDocument.load(fs.readFileSync(memTemplatePath));
    const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
    const page = baseDoc.getPage(0);
    const { width: mW } = page.getSize();

    // 1. Top Left CIN, Licence & Sl. No., Reg No.
    const slNoStr = cleanRef.includes('459383') ? cleanRef : `459383/${cleanRef.replace(/^IHREO\/?/, 'IHREO')}`;
    const refText = `CIN NO.:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${slNoStr}\nReg No. 459383`;
    page.drawText(refText, {
      x: 93.0,
      y: 740.0,
      size: 7.8,
      font: fontHelv,
      color: rgb(0.12, 0.12, 0.12),
      lineHeight: 11.9
    });

    // 2. Top Right QR Code
    try {
      const domain = resolveAppDomain(customDomain);
      const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 120 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: 442.63, y: 686.92, width: 56.90, height: 56.90 });
    } catch (qrErr) {}

    // 3. Recipient Photo inside Center Slot
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#333333', 1.5, 300, 340);
    if (pImg) {
      page.drawImage(pImg, { x: 254.63, y: 360.09, width: 88.06, height: 99.58 });
    }

    // 4. Recipient Name inside Bottom Capsule
    const rawName = studentData.fullName || studentData.name || 'Member Name';
    const nameStr = String(rawName).trim().toUpperCase();
    let nameSize = 16.5;
    while (nameSize > 9 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 310) {
      nameSize -= 0.5;
    }
    const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
    page.drawText(nameStr, {
      x: (mW - nw) / 2,
      y: 266.5,
      size: nameSize,
      font: fontTimesBold,
      color: rgb(0.08, 0.08, 0.08)
    });

    // 5. Date of Issue centered above bottom logos
    const dateFormatted = studentData.letterIssuedAt
      ? new Date(studentData.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const dateStr = `Date of Issue : ${dateFormatted}`;
    const dw = fontHelv.widthOfTextAtSize(dateStr, 9.0);
    page.drawText(dateStr, {
      x: (mW - dw) / 2,
      y: 181.0,
      size: 9.0,
      font: fontHelv,
      color: rgb(0.12, 0.12, 0.12)
    });

    pdfBytes = await baseDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, Buffer.from([]));
  } catch (err) {
    console.error('Membership cert generation error:', err);
  }
  return {
    templateId,
    pngUrl: `/uploads/certificates/${name}.png`,
    pdfUrl: `/uploads/certificates/${name}.pdf`,
    pdfBytes
  };
};
