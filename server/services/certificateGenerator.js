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
  if (lower.includes('appreciation')) return 'Certificate of Appreciation';
  if (lower.includes('gaurav') || lower.includes('ratan')) return 'Bhartiya Gaurav Ratan Samman';
  if (lower.includes('shree') || (lower.includes('rashtriya') && lower.includes('padma'))) return 'Rashtriya Padma Shree Samman';
  if (lower.includes('padma')) return 'Bhartiya Padma Bhushan Samman';
  if (lower.includes('arya') || lower.includes('samaj')) return 'Arya Bhushan Samaj Seva Award';
  if (lower.includes('doctorate')) return 'Honorary Doctorate Award';
  if (lower.includes('membership')) return 'Certificate of Lifetime Membership';
  if (lower.includes('id-card') || lower.includes('id card')) return 'Universal ID Card';
  return templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getAwardCategory = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('appreciation')) return 'Appreciation';
  if (lower.includes('gaurav') || lower.includes('ratan') || lower.includes('shree') || (lower.includes('rashtriya') && lower.includes('padma')) || lower.includes('padma') || lower.includes('arya') || lower.includes('samaj')) return 'Honorary Awards';
  if (lower.includes('doctorate')) return 'Academic & Honorary';
  if (lower.includes('membership')) return 'Membership';
  if (lower.includes('id-card') || lower.includes('id card')) return 'Identity Card';
  return 'Official Documents';
};

// ── Curated Authentic Template List ──
export const getAvailableTemplates = () => {
  return [
    {
      id: 'Certificate of Appreciation',
      filename: 'Certificate of Appreciation.pdf',
      label: 'Certificate of Appreciation',
      category: 'Appreciation',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Certificate%20of%20Appreciation.png'
    },
    {
      id: 'BHARTIYA GAURAV RATAN SAMMAN',
      filename: 'BHARTIYA GAURAV RATAN SAMMAN.pdf',
      label: 'Bhartiya Gaurav Ratan Samman',
      category: 'Honorary Awards',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/BHARTIYA%20GAURAV%20RATAN%20SAMMAN.png'
    },
    {
      id: 'RASHTRIYA PADMA SHREE SAMMAN',
      filename: 'RASHTRIYA PADMA SHREE SAMMAN.pdf',
      label: 'Rashtriya Padma Shree Samman',
      category: 'Honorary Awards',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/RASHTRIYA%20PADMA%20SHREE%20SAMMAN.png'
    },
    {
      id: 'Bhartiya Padma Bhushan Samman',
      filename: 'Bhartiya Padma Bhushan Samman.pdf',
      label: 'Bhartiya Padma Bhushan Samman',
      category: 'Honorary Awards',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Bhartiya%20Padma%20Bhushan%20Samman.png'
    },
    {
      id: 'ARYA BHUSHAN SAMAJ SEVA AWARD',
      filename: 'ARYA BHUSHAN SAMAJ SEVA AWARD.pdf',
      label: 'Arya Bhushan Samaj Seva Award',
      category: 'Honorary Awards',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/ARYA%20BHUSHAN%20SAMAJ%20SEVA%20AWARD.png'
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
      let b64 = commaIdx !== -1 ? trimmed.slice(commaIdx + 1) : trimmed;
      if (b64.includes('%')) {
        try {
          b64 = decodeURIComponent(b64);
        } catch {}
      }
      const cleanB64 = b64.replace(/\s+/g, '').replace(/ /g, '+');
      const buf = Buffer.from(cleanB64, 'base64');
      if (buf && buf.length > 0) return buf;
    } catch (e) {
      console.warn('Base64 parse warning:', e.message);
    }
  }

  // 2. Raw Base64 string
  if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed.slice(0, 200))) {
    try {
      let b64 = trimmed;
      if (b64.includes('%')) {
        try {
          b64 = decodeURIComponent(b64);
        } catch {}
      }
      const cleanB64 = b64.replace(/\s+/g, '').replace(/ /g, '+');
      const buf = Buffer.from(cleanB64, 'base64');
      if (buf && buf.length > 0) return buf;
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

// ── Safe Pure PDF-Lib Image Embedder (Zero native dependencies) ─────────────
const embedImageBuffer = async (pdfDoc, buf) => {
  if (!buf || !buf.length) return null;
  // If buffer matches JPEG signature (0xFF 0xD8)
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xD8) {
    try {
      return await pdfDoc.embedJpg(buf);
    } catch (e1) {
      try {
        return await pdfDoc.embedPng(buf);
      } catch (e2) {
        return null;
      }
    }
  }
  // If buffer matches PNG signature (0x89 0x50 0x4E 0x47)
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    try {
      return await pdfDoc.embedPng(buf);
    } catch (e1) {
      try {
        return await pdfDoc.embedJpg(buf);
      } catch (e2) {
        return null;
      }
    }
  }
  // Otherwise try JPG then PNG
  try {
    return await pdfDoc.embedJpg(buf);
  } catch {
    try {
      return await pdfDoc.embedPng(buf);
    } catch {
      return null;
    }
  }
};

// ── Helper to draw rounded rectangle path cross-environment ─────────────────
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

// ── Embed photo helper with shape masking (rect / circle) ───────────────────
const embedPhotoWithShape = async (
  pdfDoc,
  studentData,
  shape = 'rect',
  borderColor = '#222222',
  borderWidth = 1.5,
  targetWidth = 300,
  targetHeight = 300,
  cornerRadiusPt = 9.56,
  frameWidthPt = 88.01
) => {
  const photoUrl = studentData.photoUrl || studentData.recipient_photo || studentData.photo || studentData.image;
  if (!photoUrl) return null;
  try {
    const rawBuf = await getPhotoBuffer(photoUrl);
    if (!rawBuf || !rawBuf.length) return null;

    try {
      const { createCanvas, loadImage } = await import('canvas');
      const img = await loadImage(rawBuf);
      const w = img.width || 400;
      const h = img.height || 400;
      const canvas = createCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');

      const scaleFactor = targetWidth / (frameWidthPt || targetWidth);
      const canvasBw = borderWidth > 0 ? Math.max(1, borderWidth * scaleFactor) : 0;

      if (shape === 'circle') {
        const radius = Math.min(targetWidth, targetHeight) / 2 - canvasBw;
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
        ctx.drawImage(img, sx, sy, minDim, minDim, canvasBw, canvasBw, targetWidth - canvasBw * 2, targetHeight - canvasBw * 2);
        ctx.restore();

        if (canvasBw > 0) {
          ctx.lineWidth = canvasBw * 2;
          ctx.strokeStyle = borderColor;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Calculate canvas corner radius matching the exact physical PDF points corner radius
        const canvasRadius = (cornerRadiusPt || 9.56) * scaleFactor;

        // Clip photo with exact rounded rectangle clipping mask
        drawRoundedRect(ctx, 0, 0, targetWidth, targetHeight, canvasRadius);
        ctx.save();
        ctx.clip();

        // Cover fit (object-fit: cover) inside photo frame to preserve aspect ratio and avoid distortion
        const imgAspect = w / h;
        const targetAspect = targetWidth / targetHeight;
        let drawW, drawH, drawX, drawY;
        if (imgAspect > targetAspect) {
          drawH = targetHeight;
          drawW = drawH * imgAspect;
          drawX = (targetWidth - drawW) / 2;
          drawY = 0;
        } else {
          drawW = targetWidth;
          drawH = drawW / imgAspect;
          drawX = 0;
          drawY = (targetHeight - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Stroke rounded border if requested
        if (canvasBw > 0) {
          drawRoundedRect(
            ctx,
            canvasBw / 2,
            canvasBw / 2,
            targetWidth - canvasBw,
            targetHeight - canvasBw,
            Math.max(0, canvasRadius - canvasBw / 2)
          );
          ctx.lineWidth = canvasBw;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }

      const pngBuf = canvas.toBuffer('image/png');
      return await pdfDoc.embedPng(pngBuf);
    } catch (canvasErr) {
      console.warn('Canvas photo masking fallback (serverless environment):', canvasErr.message);
      return await embedImageBuffer(pdfDoc, rawBuf);
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
  // Frame bounds: width: 88.01, height: 95.05, x: 253.66, y: 377.78, cornerRadius: 9.56 pt
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#222222', 1.5, 300, 324, 9.56, 88.01);
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
  // Frame bounds: width: 109.52, height: 116.01, x: 243.06, y: 251.93, cornerRadius: 11.84 pt
  const targetW = 109.52;
  const targetH = 116.01;
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#754805', 1.8, 300, 318, 11.84, targetW);
  if (pImg) {
    page.drawImage(pImg, {
      x: 243.06,
      y: 251.93,
      width: targetW,
      height: targetH
    });
  } else {
    console.warn('Padma Bhushan photo embedding: no photo image returned from embedPhotoWithShape');
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

// ── 3. Render Arya Bhushan Samaj Seva Award ────────────────────────────────
const renderAryaBhushan = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW } = page.getSize();
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await baseDoc.embedFont(StandardFonts.TimesRomanItalic);

  const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
  const licenceNo = studentData.licence_no || '176566';
  const regNo = studentData.reg_no || '459383';

  // Format serial number
  let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO2026/154';
  let formattedSlNo = String(rawSlNo).trim();
  if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
    formattedSlNo = `459383/${formattedSlNo}`;
  }

  // Certificate number for QR code verification
  const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0154').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left 4 Lines (exact vector coordinates from reference PDF)
  const textColor = rgb(0.08, 0.08, 0.08);
  page.drawText(`CIN NO.:- ${cinNo}`, { x: 88.50, y: 776.17, size: 8.08, font: fontHelv, color: textColor });
  page.drawText(`Licence No.:- ${licenceNo}`, { x: 88.50, y: 765.22, size: 9.26, font: fontHelv, color: textColor });
  page.drawText(`Sl. No. ${formattedSlNo}`, { x: 88.50, y: 755.36, size: 8.37, font: fontHelv, color: textColor });
  page.drawText(`Reg No. ${regNo}`, { x: 88.50, y: 746.09, size: 8.37, font: fontHelv, color: textColor });

  // 2. Top Right Dynamic QR Code (x: 464.94, y: 739.54, size: 42.52)
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 200, errorCorrectionLevel: 'M' });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 464.94,
      y: 739.54,
      width: 42.52,
      height: 42.52
    });
  } catch (qrErr) {
    console.warn('Arya Bhushan QR code error:', qrErr.message);
  }

  // 3. Recipient Photo inside original rounded rectangular frame
  // Frame bounds: x: 254.52, y: 441.18, width: 86.01, height: 97.94, radius: 6.87 pt, border: 0.57pt black
  const targetW = 86.01;
  const targetH = 97.94;
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#000000', 0.57, 300, 342, 6.87, targetW);
  if (pImg) {
    page.drawImage(pImg, {
      x: 254.52,
      y: 441.18,
      width: targetW,
      height: targetH
    });
  } else {
    console.warn('Arya Bhushan photo embedding: no photo image returned from embedPhotoWithShape');
  }

  // 4. Recipient Name: Italic red name centered over gold underline (from x: 177.82 to 497.11, center: 337.46, y: 386.51)
  const redColor = rgb(0.65, 0.05, 0.05);
  const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
  let nameSize = 24.39;
  const maxNameW = 310;
  while (nameSize > 11 && fontTimesItalic.widthOfTextAtSize(nameStr, nameSize) > maxNameW) {
    nameSize -= 0.5;
  }
  const nameW = fontTimesItalic.widthOfTextAtSize(nameStr, nameSize);
  const nameX = 337.46 - (nameW / 2);
  page.drawText(nameStr, {
    x: nameX,
    y: 386.51,
    size: nameSize,
    font: fontTimesItalic,
    color: redColor
  });

  // 5. Award Subject (Dynamic): e.g. Social Worker, Educationist, Business Leader
  const subjectStr = String(studentData.subject || studentData.award_subject || studentData.designation || studentData.category || 'Social Worker').trim();
  let subjectSize = 18.0;
  while (subjectSize > 10 && fontTimesBold.widthOfTextAtSize(subjectStr, subjectSize) > 400) {
    subjectSize -= 0.5;
  }
  const subjectW = fontTimesBold.widthOfTextAtSize(subjectStr, subjectSize);
  page.drawText(subjectStr, {
    x: (pW - subjectW) / 2,
    y: 247.79,
    size: subjectSize,
    font: fontTimesBold,
    color: redColor
  });

  // 6. Issue Date: Date of Issue : DD/MM/YYYY
  const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
  const dateFormatted = formatIssueDate(rawDate, 'DD/MM/YYYY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dateW = fontTimesBold.widthOfTextAtSize(dateStr, 10.0);
  page.drawText(dateStr, {
    x: (pW - dateW) / 2,
    y: 122.50,
    size: 10.0,
    font: fontTimesBold,
    color: redColor
  });
};

// ── 4. Render Rashtriya Padma Shree Samman ────────────────────────────────
const renderRashtriyaPadmaShree = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW } = page.getSize();
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);

  const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
  const licenceNo = studentData.licence_no || '176566';
  const regNo = studentData.reg_no || '459383';

  // Format serial number
  let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0218';
  let formattedSlNo = String(rawSlNo).trim();
  if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
    formattedSlNo = `459383/${formattedSlNo}`;
  }

  // Certificate number for QR code verification
  const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0218').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left 4 Lines (exact vector coordinates from reference PDF)
  const fontSize = 10.86;
  const textColor = rgb(0.08, 0.08, 0.08);

  page.drawText(`CIN NO:- ${cinNo}`, { x: 46.51, y: 779.08, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Licence No:- ${licenceNo}`, { x: 46.51, y: 766.92, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Sl. No. ${formattedSlNo}`, { x: 46.51, y: 754.76, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Reg No. ${regNo}`, { x: 46.51, y: 742.60, size: fontSize, font: fontHelv, color: textColor });

  // 2. Right-side Dynamic QR Code (x: 509.10, y: 663.20, width: 54.24, height: 54.24)
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 220, errorCorrectionLevel: 'M' });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 509.10,
      y: 663.20,
      width: 54.24,
      height: 54.24
    });
  } catch (qrErr) {
    console.warn('QR code generation warning:', qrErr.message);
  }

  // 3. Recipient Photo inside original rounded rectangular gold frame
  // Frame bounds: width: 109.46, height: 115.79, x: 243.96, y: 379.06, cornerRadius: 11.84 pt
  const targetW = 109.46;
  const targetH = 115.79;
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#754805', 1.8, 300, 318, 11.84, targetW);
  if (pImg) {
    page.drawImage(pImg, {
      x: 243.96,
      y: 379.06,
      width: targetW,
      height: targetH
    });
  } else {
    console.warn('Rashtriya Padma Shree photo embedding: no photo image returned from embedPhotoWithShape');
  }

  // 4. Recipient Name: dynamic dark red, centered at pW / 2, y: 331.56
  const redColor = rgb(0.40, 0.0, 0.0); // #660000 / deep dark red
  const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
  let nameSize = 25.5;
  while (nameSize > 12 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 280) {
    nameSize -= 0.5;
  }
  const nameW = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nameW) / 2,
    y: 331.56,
    size: nameSize,
    font: fontTimesBold,
    color: redColor
  });

  // Note: Reference certificate has NO Date of Issue field.
};

// ── 5. Render Bhartiya Gaurav Ratan Samman ────────────────────────────────
const renderBhartiyaGauravRatan = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW } = page.getSize();
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);

  const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
  const licenceNo = studentData.licence_no || '176566';
  const regNo = studentData.reg_no || '459383';

  // Format serial number: e.g. 459383/IHREO0223
  let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0223';
  let formattedSlNo = String(rawSlNo).trim();
  if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
    formattedSlNo = `459383/${formattedSlNo}`;
  }

  // Certificate number for QR code verification
  const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0223').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left 4 Lines (exact vector coordinates from reference PDF)
  const fontSize = 9.0;
  const textColor = rgb(0.08, 0.08, 0.08);

  page.drawText(`CIN NO:- ${cinNo}`, { x: 86.40, y: 753.00, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Licence No:- ${licenceNo}`, { x: 86.40, y: 743.00, size: fontSize, font: fontHelv, color: textColor });
  page.drawText(`Sl. No. ${formattedSlNo}`, { x: 86.40, y: 733.00, size: fontSize, font: fontHelvBold, color: textColor });
  page.drawText(`Reg No. ${regNo}`, { x: 86.40, y: 723.00, size: fontSize, font: fontHelvBold, color: textColor });

  // 2. Right-side Dynamic QR Code (x: 451.06, y: 703.62, width: 56.64, height: 56.64)
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 220, errorCorrectionLevel: 'M' });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 451.06,
      y: 703.62,
      width: 56.64,
      height: 56.64
    });
  } catch (qrErr) {
    console.warn('QR code generation warning:', qrErr.message);
  }

  // 3. Recipient Photo inside original rounded rectangular frame
  // Frame bounds: x: 243.21, y: 251.85, width: 109.27, height: 116.06, cornerRadius: 11.84 pt, border: 2.0 pt #754805
  const targetW = 109.27;
  const targetH = 116.06;
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#754805', 2.0, 300, 319, 11.84, targetW);
  if (pImg) {
    page.drawImage(pImg, {
      x: 243.21,
      y: 251.85,
      width: targetW,
      height: targetH
    });
  } else {
    console.warn('Bhartiya Gaurav Ratan photo embedding: no photo image returned from embedPhotoWithShape');
  }

  // 4. Recipient Name: Centered horizontally at pW / 2 = 298.61, y: 224.50
  // Font: Times-Bold, size: 21 pt (scaled down if longer than 280 pt), color: black (#000000)
  const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
  let nameSize = 21.0;
  while (nameSize > 10.0 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 280) {
    nameSize -= 0.5;
  }
  const nameW = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nameW) / 2,
    y: 224.50,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0, 0, 0)
  });

  // 5. Date of Issue: "Date of Issue : DD-MM-YYYY"
  // Font: Helvetica regular, size: 10.75 pt, centered at x = 286.36, baseline y = 130.00
  const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
  const dateFormatted = formatIssueDate(rawDate, 'DD-MM-YYYY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dateW = fontHelv.widthOfTextAtSize(dateStr, 10.75);
  page.drawText(dateStr, {
    x: 286.36 - dateW / 2,
    y: 130.00,
    size: 10.75,
    font: fontHelv,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// ── 6. Render Certificate of Appreciation (A4 Landscape, Name only) ───────
const renderCertificateOfAppreciation = async (baseDoc, page, studentData) => {
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);

  // Recipient Name: Centered horizontally over the orange line at x = 430.42, baseline y = 327.13
  // Original size: 40.5 pt, color: dark black (#111827 / rgb(0.07, 0.09, 0.15))
  const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
  let nameSize = 40.5;
  // Orange line is width 450 pt (205.47 to 655.37). Max allowable name width ~440 pt
  while (nameSize > 18.0 && fontTimes.widthOfTextAtSize(nameStr, nameSize) > 440) {
    nameSize -= 0.5;
  }
  const nameW = fontTimes.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: 430.42 - nameW / 2,
    y: 327.13,
    size: nameSize,
    font: fontTimes,
    color: rgb(0.07, 0.09, 0.15)
  });
  // STRICT REQUIREMENT: NO PHOTO, NO QR CODE, NO DATES OR IDENTIFICATION NUMBERS
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
  if (lower.includes('appreciation')) {
    await renderCertificateOfAppreciation(baseDoc, page, studentData);
  } else if (lower.includes('gaurav') || lower.includes('ratan')) {
    await renderBhartiyaGauravRatan(baseDoc, page, studentData, customDomain);
  } else if (lower.includes('shree') || (lower.includes('rashtriya') && lower.includes('padma'))) {
    await renderRashtriyaPadmaShree(baseDoc, page, studentData, customDomain);
  } else if (lower.includes('padma')) {
    await renderPadmaBhushan(baseDoc, page, studentData, customDomain);
  } else if (lower.includes('arya') || lower.includes('samaj')) {
    await renderAryaBhushan(baseDoc, page, studentData, customDomain);
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
      const isAppreciation = String(templateId || '').toLowerCase().includes('appreciation');
      const isGaurav = !isAppreciation && (String(templateId || '').toLowerCase().includes('gaurav') || String(templateId || '').toLowerCase().includes('ratan'));
      const isShree = !isAppreciation && !isGaurav && (String(templateId || '').toLowerCase().includes('shree') || (String(templateId || '').toLowerCase().includes('rashtriya') && String(templateId || '').toLowerCase().includes('padma')));
      const isPadma = !isAppreciation && !isGaurav && !isShree && String(templateId || '').toLowerCase().includes('padma');
      const isArya = !isAppreciation && !isGaurav && (String(templateId || '').toLowerCase().includes('arya') || String(templateId || '').toLowerCase().includes('samaj'));
      const basePngPath = findTemplateFile(templateId, ['.png']) || (isAppreciation ? findTemplateFile('Certificate of Appreciation', ['.png']) : (isGaurav ? findTemplateFile('BHARTIYA GAURAV RATAN SAMMAN', ['.png']) : (isShree ? findTemplateFile('RASHTRIYA PADMA SHREE SAMMAN', ['.png']) : (isPadma ? findTemplateFile('Bhartiya Padma Bhushan Samman', ['.png']) : (isArya ? findTemplateFile('ARYA BHUSHAN SAMAJ SEVA AWARD', ['.png']) : findTemplateFile('Doctorate IHREO', ['.png']))))));
      if (basePngPath && fs.existsSync(basePngPath)) {
        const { createCanvas, loadImage } = await import('canvas');
        const bgImg = await loadImage(basePngPath);

        if (isAppreciation) {
          const canvas = createCanvas(bgImg.width, bgImg.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bgImg, 0, 0);

          const scaleX = bgImg.width / 841.8898;
          const scaleY = bgImg.height / 595.2756;

          const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
          ctx.textAlign = 'center';
          let namePx = Math.round(40.5 * scaleX);
          ctx.font = `${namePx}px "Times New Roman", Times, serif`;
          while (namePx > Math.round(18.0 * scaleX) && ctx.measureText(nameStr).width > 440 * scaleX) {
            namePx -= 1;
            ctx.font = `${namePx}px "Times New Roman", Times, serif`;
          }
          ctx.fillStyle = '#111827';
          ctx.fillText(nameStr, 430.42 * scaleX, (595.2756 - 327.13) * scaleY);

          fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
        } else if (isGaurav) {
          const canvas = createCanvas(bgImg.width, bgImg.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bgImg, 0, 0);

          const scaleX = bgImg.width / 597.224;
          const scaleY = bgImg.height / 843.920;

          const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
          const licNo = studentData.licence_no || '176566';
          const regNo = studentData.reg_no || '459383';
          let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0223';
          let formattedSlNo = String(rawSlNo).trim();
          if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
            formattedSlNo = `459383/${formattedSlNo}`;
          }

          // Top Left 4 Lines
          ctx.fillStyle = '#111827';
          const fontSizePx = Math.round(9.0 * scaleX);
          ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`CIN NO:- ${cinNo}`, 86.40 * scaleX, (843.920 - 753.00) * scaleY);
          ctx.fillText(`Licence No:- ${licNo}`, 86.40 * scaleX, (843.920 - 743.00) * scaleY);
          ctx.font = `bold ${fontSizePx}px Arial, Helvetica, sans-serif`;
          ctx.fillText(`Sl. No. ${formattedSlNo}`, 86.40 * scaleX, (843.920 - 733.00) * scaleY);
          ctx.fillText(`Reg No. ${regNo}`, 86.40 * scaleX, (843.920 - 723.00) * scaleY);

          // Right-side QR Code
          const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0223').replace(/WCAEO/gi, 'IHREO');
          const domain = resolveAppDomain(customDomain);
          const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
          const qrBuf = await QRCode.toBuffer(verifyUrl, { margin: 1, width: Math.round(56.64 * scaleX) });
          const qrImg = await loadImage(qrBuf);
          ctx.drawImage(qrImg, 451.06 * scaleX, (843.920 - 703.62 - 56.64) * scaleY, 56.64 * scaleX, 56.64 * scaleY);

          // Recipient Photo inside original rounded gold frame
          const rawBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo || studentData.photo || studentData.image);
          if (rawBuf) {
            const photo = await loadImage(rawBuf);
            const pX = 243.21 * scaleX;
            const pY = (843.920 - 251.85 - 116.06) * scaleY;
            const pW = 109.27 * scaleX;
            const pH = 116.06 * scaleY;
            const radius = 11.84 * scaleX;
            const bw = 2.0 * scaleX;

            ctx.save();
            drawRoundedRect(ctx, pX, pY, pW, pH, radius);
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
            drawRoundedRect(ctx, pX + bw / 2, pY + bw / 2, pW - bw, pH - bw, Math.max(0, radius - bw / 2));
            ctx.lineWidth = bw;
            ctx.strokeStyle = '#754805';
            ctx.stroke();
            ctx.restore();
          }

          // Recipient Name with controlled scaling
          const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
          ctx.textAlign = 'center';
          let namePx = Math.round(21.0 * scaleX);
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          while (namePx > Math.round(10 * scaleX) && ctx.measureText(nameStr).width > 280 * scaleX) {
            namePx -= 1;
            ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          }
          ctx.fillStyle = '#000000';
          ctx.fillText(nameStr, bgImg.width / 2, (843.920 - 224.50) * scaleY);

          // Date of Issue
          const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
          const dateFormatted = formatIssueDate(rawDate, 'DD-MM-YYYY');
          ctx.textAlign = 'center';
          ctx.font = `${Math.round(10.75 * scaleX)}px Arial, Helvetica, sans-serif`;
          ctx.fillStyle = '#111827';
          ctx.fillText(`Date of Issue : ${dateFormatted}`, 286.36 * scaleX, (843.920 - 130.00) * scaleY);

          fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
        } else if (isShree) {
          const canvas = createCanvas(bgImg.width, bgImg.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bgImg, 0, 0);

          const scaleX = bgImg.width / 597.2954;
          const scaleY = bgImg.height / 843.896;

          const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
          const licNo = studentData.licence_no || '176566';
          const regNo = studentData.reg_no || '459383';
          let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO0218';
          let formattedSlNo = String(rawSlNo).trim();
          if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
            formattedSlNo = `459383/${formattedSlNo}`;
          }

          // Top Left 4 Lines
          ctx.fillStyle = '#111827';
          const fontSizePx = Math.round(10.86 * scaleX);
          ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`CIN NO:- ${cinNo}`, 46.51 * scaleX, (843.896 - 779.08) * scaleY);
          ctx.fillText(`Licence No:- ${licNo}`, 46.51 * scaleX, (843.896 - 766.92) * scaleY);
          ctx.fillText(`Sl. No. ${formattedSlNo}`, 46.51 * scaleX, (843.896 - 754.76) * scaleY);
          ctx.fillText(`Reg No. ${regNo}`, 46.51 * scaleX, (843.896 - 742.60) * scaleY);

          // Right-side QR Code
          const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0218').replace(/WCAEO/gi, 'IHREO');
          const domain = resolveAppDomain(customDomain);
          const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
          const qrBuf = await QRCode.toBuffer(verifyUrl, { margin: 1, width: Math.round(54.24 * scaleX) });
          const qrImg = await loadImage(qrBuf);
          ctx.drawImage(qrImg, 509.10 * scaleX, (843.896 - 663.20 - 54.24) * scaleY, 54.24 * scaleX, 54.24 * scaleY);

          // Recipient Photo inside original rounded gold frame
          const rawBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo || studentData.photo || studentData.image);
          if (rawBuf) {
            const photo = await loadImage(rawBuf);
            const pX = 243.96 * scaleX;
            const pY = (843.896 - 379.06 - 115.79) * scaleY;
            const pW = 109.46 * scaleX;
            const pH = 115.79 * scaleY;
            const radius = 11.84 * scaleX;
            const bw = 2.0 * scaleX;

            ctx.save();
            drawRoundedRect(ctx, pX, pY, pW, pH, radius);
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
            drawRoundedRect(ctx, pX + bw / 2, pY + bw / 2, pW - bw, pH - bw, Math.max(0, radius - bw / 2));
            ctx.lineWidth = bw;
            ctx.strokeStyle = '#754805';
            ctx.stroke();
            ctx.restore();
          }

          // Recipient Name with controlled scaling
          const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
          ctx.textAlign = 'center';
          let namePx = Math.round(25.5 * scaleX);
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          while (namePx > Math.round(11 * scaleX) && ctx.measureText(nameStr).width > 280 * scaleX) {
            namePx -= 1;
            ctx.font = `bold ${namePx}px "Times New Roman", serif`;
          }
          ctx.fillStyle = '#660000';
          ctx.fillText(nameStr, bgImg.width / 2, (843.896 - 331.56) * scaleY);

          fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
        } else if (isPadma) {
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
          const rawBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo || studentData.photo || studentData.image);
          if (rawBuf) {
            const photo = await loadImage(rawBuf);
            const pX = 243.42 * scaleX;
            const pY = (843.92 - 252.10 - 115.66) * scaleY;
            const pW = 108.86 * scaleX;
            const pH = 115.66 * scaleY;
            const radius = 11.84 * scaleX;
            const bw = 2.0 * scaleX;

            ctx.save();
            drawRoundedRect(ctx, pX, pY, pW, pH, radius);
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
            drawRoundedRect(ctx, pX + bw/2, pY + bw/2, pW - bw, pH - bw, Math.max(0, radius - bw/2));
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
        } else if (isArya) {
          const canvas = createCanvas(bgImg.width, bgImg.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bgImg, 0, 0);

          const scaleX = bgImg.width / 597.28;
          const scaleY = bgImg.height / 843.89;

          const cinNo = studentData.cin_no || 'U85499DL2025NPL459383';
          const licNo = studentData.licence_no || '176566';
          const regNo = studentData.reg_no || '459383';
          let rawSlNo = studentData.serial_no || studentData.refno || '459383/IHREO2026/154';
          let formattedSlNo = String(rawSlNo).trim();
          if (!formattedSlNo.includes('459383') && !formattedSlNo.includes('/')) {
            formattedSlNo = `459383/${formattedSlNo}`;
          }

          // Top Left 4 Lines
          ctx.fillStyle = '#111827';
          ctx.font = `${Math.round(8.08 * scaleX)}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`CIN NO.:- ${cinNo}`, 88.50 * scaleX, (843.89 - 776.17) * scaleY);
          ctx.font = `${Math.round(9.26 * scaleX)}px Arial, Helvetica, sans-serif`;
          ctx.fillText(`Licence No.:- ${licNo}`, 88.50 * scaleX, (843.89 - 765.22) * scaleY);
          ctx.font = `${Math.round(8.37 * scaleX)}px Arial, Helvetica, sans-serif`;
          ctx.fillText(`Sl. No. ${formattedSlNo}`, 88.50 * scaleX, (843.89 - 755.36) * scaleY);
          ctx.fillText(`Reg No. ${regNo}`, 88.50 * scaleX, (843.89 - 746.09) * scaleY);

          // Top Right QR
          const cleanCertNo = String(studentData.certificateNumber || formattedSlNo.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0154').replace(/WCAEO/gi, 'IHREO');
          const domain = resolveAppDomain(customDomain);
          const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
          const qrBuf = await QRCode.toBuffer(verifyUrl, { margin: 1, width: Math.round(42.52 * scaleX) });
          const qrImg = await loadImage(qrBuf);
          ctx.drawImage(qrImg, 464.94 * scaleX, (843.89 - 739.54 - 42.52) * scaleY, 42.52 * scaleX, 42.52 * scaleY);

          // Recipient Photo inside frame: x: 254.52, y: 441.18, w: 86.01, h: 97.94
          const rawBuf = await getPhotoBuffer(studentData.photoUrl || studentData.recipient_photo || studentData.photo || studentData.image);
          if (rawBuf) {
            const photo = await loadImage(rawBuf);
            const pX = 254.52 * scaleX;
            const pY = (843.89 - 441.18 - 97.94) * scaleY;
            const pW = 86.01 * scaleX;
            const pH = 97.94 * scaleY;
            const radius = 6.87 * scaleX;
            const bw = 0.57 * scaleX;

            ctx.save();
            drawRoundedRect(ctx, pX, pY, pW, pH, radius);
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
            drawRoundedRect(ctx, pX + bw/2, pY + bw/2, pW - bw, pH - bw, Math.max(0, radius - bw/2));
            ctx.lineWidth = bw;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            ctx.restore();
          }

          // Recipient Name (Italic red over underline at center 337.46, y: 386.51)
          const nameStr = String(studentData.fullName || studentData.full_name || 'Recipient Name').trim();
          ctx.textAlign = 'center';
          let namePx = Math.round(24.39 * scaleX);
          ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
          const maxNamePx = 310 * scaleX;
          while (namePx > Math.round(11 * scaleX) && ctx.measureText(nameStr).width > maxNamePx) {
            namePx -= 1;
            ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
          }
          ctx.fillStyle = '#a41212';
          ctx.fillText(nameStr, 337.46 * scaleX, (843.89 - 386.51) * scaleY);

          // Award Subject: e.g. Social Worker
          const subjectStr = String(studentData.subject || studentData.award_subject || studentData.designation || studentData.category || 'Social Worker').trim();
          let subjectPx = Math.round(18.0 * scaleX);
          ctx.font = `bold ${subjectPx}px "Times New Roman", serif`;
          while (subjectPx > Math.round(10 * scaleX) && ctx.measureText(subjectStr).width > 400 * scaleX) {
            subjectPx -= 1;
            ctx.font = `bold ${subjectPx}px "Times New Roman", serif`;
          }
          ctx.fillText(subjectStr, bgImg.width / 2, (843.89 - 247.79) * scaleY);

          // Issue Date: Date of Issue : DD/MM/YYYY
          const rawDate = studentData.letterIssuedAt || studentData.issue_date || new Date();
          const dateFormatted = formatIssueDate(rawDate, 'DD/MM/YYYY');
          ctx.font = `bold ${Math.round(10.0 * scaleX)}px "Times New Roman", serif`;
          ctx.fillText(`Date of Issue : ${dateFormatted}`, bgImg.width / 2, (843.89 - 122.50) * scaleY);

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

          // Photo inside center frame: width: 88, height: 95, radius: 9.56
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const photo = await loadImage(rawBuf);
              const picX = 254;
              const picY = 369;
              const picW = 88;
              const picH = 95;
              const radius = 9.56;
              const bw = 1.5;

              ctx.save();
              drawRoundedRect(ctx, picX, picY, picW, picH, radius);
              ctx.clip();

              const imgAspect = (photo.width || 400) / (photo.height || 400);
              const frameAspect = picW / picH;
              let dW, dH, dX, dY;
              if (imgAspect > frameAspect) {
                dH = picH;
                dW = dH * imgAspect;
                dX = picX + (picW - dW) / 2;
                dY = picY;
              } else {
                dW = picW;
                dH = dW / imgAspect;
                dX = picX;
                dY = picY + (picH - dH) / 2;
              }
              ctx.drawImage(photo, dX, dY, dW, dH);
              ctx.restore();

              ctx.save();
              drawRoundedRect(ctx, picX + bw / 2, picY + bw / 2, picW - bw, picH - bw, Math.max(0, radius - bw / 2));
              ctx.strokeStyle = '#222222';
              ctx.lineWidth = bw;
              ctx.stroke();
              ctx.restore();
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

    // 3. Recipient Photo inside left frame: width: 37.71, height: 41.59, cornerRadius: 4.06 pt
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#333333', 1.0, 200, 221, 4.06, 37.71);
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

    // 3. Recipient Photo inside Center Slot: width: 88.06, height: 99.58, cornerRadius: 9.56 pt
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#333333', 1.5, 300, 339, 9.56, 88.06);
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
