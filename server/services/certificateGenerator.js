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
  if (lower.includes('doctorate')) return 'Honorary Doctorate Award';
  if (lower.includes('arya') || (lower.includes('samaj') && !lower.includes('padma'))) return 'Arya Bhushan Samaj Seva Award';
  if (lower.includes('business')) return 'Best Business Icon Award';
  if (lower.includes('padma') || lower.includes('padm')) return 'Bhartiya Padma Bhushan Samman';
  if (lower.includes('gaurav') || lower.includes('ashok') || lower.includes('ratan')) return 'Bhartiye Gaurav Ratan Samman';
  if (lower.includes('women') || lower.includes('icon')) return 'Women Icon Award';
  return templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getAwardCategory = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('samaj') || lower.includes('padm') || lower.includes('gaurav') || lower.includes('ashok')) {
    return 'National Honors';
  }
  if (lower.includes('business')) {
    return 'Business & Excellence';
  }
  if (lower.includes('doctorate')) {
    return 'Academic & Honorary';
  }
  if (lower.includes('women') || lower.includes('icon')) {
    return 'Literary & Cultural';
  }
  return 'National Honors';
};

// ── Curated Authentic Template List (5 New + Doctorate IHREO) ────────────────
export const getAvailableTemplates = () => {
  return [
    {
      id: 'Doctorate IHREO',
      filename: 'Doctorate IHREO.pdf',
      label: 'Honorary Doctorate Award',
      category: 'Academic & Honorary',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Doctorate%20IHREO.png'
    },
    {
      id: 'Arya Bhushan Samaj Seva Award',
      filename: 'Arya Bhushan Samaj Seva Award.pdf',
      label: 'Arya Bhushan Samaj Seva Award',
      category: 'National Honors',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Arya%20Bhushan%20Samaj%20Seva%20Award.png'
    },
    {
      id: 'Best Business Icon Award',
      filename: 'Best Business Icon Award.pdf',
      label: 'Best Business Icon Award',
      category: 'Business & Excellence',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Best%20Business%20Icon%20Award.png'
    },
    {
      id: 'Bhartiya Padma Bhushan Samman',
      filename: 'Bhartiya Padma Bhushan Samman.pdf',
      label: 'Bhartiya Padma Bhushan Samman',
      category: 'National Honors',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Bhartiya%20Padma%20Bhushan%20Samman.png'
    },
    {
      id: 'Bhartiye Gaurav Ratan Samman',
      filename: 'Bhartiye Gaurav Ratan Samman.pdf',
      label: 'Bhartiye Gaurav Ratan Samman',
      category: 'National Honors',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/Bhartiye%20Gaurav%20Ratan%20Samman.png'
    },
    {
      id: 'women icon award',
      filename: 'women icon award.pdf',
      label: 'Women Icon Award',
      category: 'Literary & Cultural',
      hasConfig: true,
      previewUrl: '/assets/certificate-templates/women%20icon%20award.png'
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

// ── 2. Render Arya Bhushan Samaj Seva Award ──────────────────────────────────
const renderAryaBhushanAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  // Recipient Name placed right on underline after "Mr./Ms." (y: 524)
  const nameStr = (studentData.fullName || 'Recipient Name').toUpperCase();
  let nameSize = 19.0;
  while (nameSize > 12 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 360) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 524,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.06, 0.14, 0.28)
  });

  // Award Category / Field on clean line (y: 710)
  const catStr = studentData.category || 'Humanitarian Services & Social Upliftment';
  let catSize = 14.0;
  while (catSize > 10 && fontTimesBold.widthOfTextAtSize(catStr, catSize) > 440) {
    catSize -= 0.5;
  }
  const cw = fontTimesBold.widthOfTextAtSize(catStr, catSize);
  page.drawText(catStr, {
    x: (pW - cw) / 2,
    y: pH - 710,
    size: catSize,
    font: fontTimesBold,
    color: rgb(0.60, 0.11, 0.11)
  });

  // Date of Issue on underline (x: 420, y: 880)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  page.drawText(dateFormatted, {
    x: 420,
    y: pH - 880,
    size: 10.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// ── 3. Render Best Business Icon Award ───────────────────────────────────────
const renderBestBusinessAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  // Recipient Photo inside Circular Frame (cx: 357, cy: 485, r: 108)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#f0c05a', 2.5, 300, 300);
  if (pImg) {
    const photoD = 216;
    page.drawImage(pImg, {
      x: (pW - photoD) / 2,
      y: pH - 485 - photoD / 2,
      width: photoD,
      height: photoD
    });
  }

  // Recipient Name in Ribbon Banner below photo (cy: 626)
  const nameStr = (studentData.fullName || 'Recipient Name').toUpperCase();
  let nameSize = 19.0;
  while (nameSize > 11 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 310) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 626,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.99, 0.90, 0.60)
  });

  // Date placed cleanly above the Ministry and MSME logos
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  const dateStr = `Date: ${dateFormatted}`;
  const dw = fontHelvBold.widthOfTextAtSize(dateStr, 9.5);
  page.drawText(dateStr, {
    x: (pW - dw) / 2,
    y: pH - 888,
    size: 9.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// ── 4. Render Bhartiya Padma Bhushan Samman ──────────────────────────────────
const renderPadmaBhushanAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  // Recipient Photo inside Circle Frame (cx: 361, cy: 340, r: 72)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#e5be65', 2.0, 240, 240);
  if (pImg) {
    const photoD = 144;
    page.drawImage(pImg, {
      x: (pW - photoD) / 2,
      y: pH - 340 - photoD / 2,
      width: photoD,
      height: photoD
    });
  }

  // Recipient Name in Ribbon Banner (cy: 433)
  const nameStr = (studentData.fullName || 'Recipient Name').toUpperCase();
  let nameSize = 16.5;
  while (nameSize > 10 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 230) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 433,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.08, 0.16, 0.32)
  });

  // Award Category in dedicated empty space below "is presented to" (y: 600)
  const catStr = studentData.category || 'Excellence in National Service & Social Leadership';
  let catSize = 13.0;
  while (catSize > 9.5 && fontTimesBold.widthOfTextAtSize(catStr, catSize) > 420) {
    catSize -= 0.5;
  }
  const cw = fontTimesBold.widthOfTextAtSize(catStr, catSize);
  page.drawText(catStr, {
    x: (pW - cw) / 2,
    y: pH - 600,
    size: catSize,
    font: fontTimesBold,
    color: rgb(0.60, 0.11, 0.11)
  });

  // Date at bottom "Government of India, this day [Date]" (x: 480, y: 926)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  page.drawText(dateFormatted, {
    x: 480,
    y: pH - 926,
    size: 9.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// ── 5. Render Bhartiye Gaurav Ratan Samman ────────────────────────────────────
const renderGauravRatanAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  // Recipient Photo inside Rectangular Frame (x: 257.5, y: 546, w: 166, h: 188)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#b8860b', 2.0, 300, 340);
  if (pImg) {
    page.drawImage(pImg, {
      x: (pW - 166) / 2,
      y: pH - 546 - 188,
      width: 166,
      height: 188
    });
  }

  // Recipient Name (below photo at y: 775)
  const nameStr = (studentData.fullName || 'Recipient Name').toUpperCase();
  let nameSize = 17.0;
  while (nameSize > 10 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 300) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 775,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.06, 0.14, 0.28)
  });

  // Award Category in place of "Wild Life Expert" (exact slot x: 295..425, y: 864)
  const catStr = studentData.category || 'National Social Welfare & Community Service';
  let catSize = 9.5;
  while (catSize > 6.5 && fontTimesBold.widthOfTextAtSize(catStr, catSize) > 120) {
    catSize -= 0.5;
  }
  const cw = fontTimesBold.widthOfTextAtSize(catStr, catSize);
  page.drawText(catStr, {
    x: 295 + (130 - cw) / 2,
    y: pH - 864,
    size: catSize,
    font: fontTimesBold,
    color: rgb(0.60, 0.11, 0.11)
  });

  // Date of Issue on underline (x: 360, y: 902)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  page.drawText(dateFormatted, {
    x: 360,
    y: pH - 902,
    size: 9.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// ── 6. Render Women Icon Award ───────────────────────────────────────────────
const renderWomenIconAward = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  // Recipient Photo inside Circle Frame (cx: 341, cy: 460, r: 85)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#e5be65', 2.0, 260, 260);
  if (pImg) {
    const photoD = 170;
    page.drawImage(pImg, {
      x: (pW - photoD) / 2,
      y: pH - 460 - photoD / 2,
      width: photoD,
      height: photoD
    });
  }

  // Recipient Name on underline (y: 730)
  const nameStr = (studentData.fullName || 'Recipient Name').toUpperCase();
  let nameSize = 19.0;
  while (nameSize > 11 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 300) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 730,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.06, 0.14, 0.28)
  });

  // Date of Issue on underline (x: 365, y: 852)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  page.drawText(dateFormatted, {
    x: 365,
    y: pH - 852,
    size: 9.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12)
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
  const lowerId = String(templateId || '').toLowerCase();

  if (lowerId.includes('padma') || lowerId.includes('padm')) {
    await renderPadmaBhushanAward(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('business')) {
    await renderBestBusinessAward(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('gaurav') || lowerId.includes('ashok') || lowerId.includes('ratan')) {
    await renderGauravRatanAward(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('women') || lowerId.includes('icon')) {
    await renderWomenIconAward(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('doctorate')) {
    await renderDoctorateAward(baseDoc, page, studentData, customDomain);
  } else {
    // Default: Arya Bhushan Samaj Seva Award
    await renderAryaBhushanAward(baseDoc, page, studentData, customDomain);
  }

  return await baseDoc.save();
};

// ── Award Certificate Generator (PDF + PNG) ──────────────────────────────────
export const generateCertificate = async (studentData, templateId, customDomain) => {
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
      const basePngPath = findTemplateFile(templateId, ['.png']) || findTemplateFile('Doctorate IHREO', ['.png']);
      if (basePngPath && fs.existsSync(basePngPath)) {
        const { createCanvas, loadImage } = await import('canvas');
        const bgImg = await loadImage(basePngPath);
        const canvas = createCanvas(bgImg.width, bgImg.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bgImg, 0, 0);

        const recipientName = (studentData.fullName || 'Recipient Name').toUpperCase();
        const category = studentData.category || 'For Outstanding Distinction & Excellence';
        const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
        const lowerId = String(templateId || '').toLowerCase();

        if (lowerId.includes('doctorate')) {
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              ctx.drawImage(pImg, 253, 377, 88, 95);
            }
          }
          ctx.textAlign = 'center';
          ctx.font = 'bold 17px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(recipientName, canvas.width / 2, 280);

          ctx.font = 'bold 14px "Times New Roman", serif';
          ctx.fillStyle = '#dc2626';
          ctx.fillText(category, canvas.width / 2, 202);
        } else if (lowerId.includes('padma') || lowerId.includes('padm')) {
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              ctx.save();
              ctx.beginPath();
              ctx.arc(canvas.width / 2, 340, 72, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(pImg, canvas.width / 2 - 72, 340 - 72, 144, 144);
              ctx.restore();
            }
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 16.5px "Times New Roman", serif';
          ctx.fillStyle = '#102a4e';
          ctx.fillText(recipientName, canvas.width / 2, 433);

          ctx.textBaseline = 'alphabetic';
          ctx.font = 'bold 13px "Times New Roman", serif';
          ctx.fillStyle = '#991b1b';
          ctx.fillText(category, canvas.width / 2, 600);

          ctx.textAlign = 'left';
          ctx.font = 'bold 9.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(dateFormatted, 480, 926);
        } else if (lowerId.includes('business')) {
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              ctx.save();
              ctx.beginPath();
              ctx.arc(canvas.width / 2, 485, 108, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(pImg, canvas.width / 2 - 108, 485 - 108, 216, 216);
              ctx.restore();
            }
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 19px "Times New Roman", serif';
          ctx.fillStyle = '#fde088';
          ctx.fillText(recipientName, canvas.width / 2, 626);

          ctx.textBaseline = 'alphabetic';
          ctx.font = 'bold 9.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(`Date: ${dateFormatted}`, canvas.width / 2, 888);
        } else if (lowerId.includes('gaurav') || lowerId.includes('ashok') || lowerId.includes('ratan')) {
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              ctx.drawImage(pImg, (canvas.width - 166) / 2, 546, 166, 188);
            }
          }
          ctx.textAlign = 'center';
          ctx.font = 'bold 17px "Times New Roman", serif';
          ctx.fillStyle = '#0f2137';
          ctx.fillText(recipientName, canvas.width / 2, 775);

          ctx.textAlign = 'center';
          ctx.font = 'bold 9.5px "Times New Roman", serif';
          ctx.fillStyle = '#991b1b';
          ctx.fillText(category, 360, 864);

          ctx.textAlign = 'left';
          ctx.font = 'bold 9.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(dateFormatted, 360, 902);
        } else if (lowerId.includes('women') || lowerId.includes('icon')) {
          if (studentData.photoUrl) {
            const rawBuf = await getPhotoBuffer(studentData.photoUrl);
            if (rawBuf) {
              const pImg = await loadImage(rawBuf);
              ctx.save();
              ctx.beginPath();
              ctx.arc(canvas.width / 2, 460, 85, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(pImg, canvas.width / 2 - 85, 460 - 85, 170, 170);
              ctx.restore();
            }
          }
          ctx.textAlign = 'center';
          ctx.font = 'bold 19px "Times New Roman", serif';
          ctx.fillStyle = '#0f2137';
          ctx.fillText(recipientName, canvas.width / 2, 730);

          ctx.textAlign = 'left';
          ctx.font = 'bold 9.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(dateFormatted, 365, 852);
        } else {
          // Arya Bhushan Samaj Seva Award
          ctx.textAlign = 'center';
          ctx.font = 'bold 19px "Times New Roman", serif';
          ctx.fillStyle = '#0c1e36';
          ctx.fillText(recipientName, canvas.width / 2, 524);

          ctx.font = 'bold 14.0px "Times New Roman", serif';
          ctx.fillStyle = '#a81c1c';
          ctx.fillText(category, canvas.width / 2, 710);

          ctx.textAlign = 'left';
          ctx.font = 'bold 10.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(dateFormatted, 420, 880);
        }

        fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
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
