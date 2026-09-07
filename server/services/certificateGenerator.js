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
  if (lower.includes('ashok')) return 'Bhartiye Ashok Samman';
  if (lower.includes('gaurav') || lower.includes('ratan')) return 'Bhartiye Gaurav Ratan Samman';
  if (lower.includes('icon') && lower.includes('business')) return 'Best Business Icon Award';
  if (lower.includes('business') && lower.includes('excellence')) return 'International Business Excellence Award';
  if (lower.includes('padm') || lower.includes('bhushan')) return 'Bhartiya Padma Bhushan Samman';
  if (lower.includes('doctorate')) return 'Honorary Doctorate Award';
  if (lower.includes('samaj') || lower.includes('seva award')) return 'Bhartiya Samaj Seva Award';
  if (lower.includes('enterpreneur') || lower.includes('entrepreneur')) return 'International Best Entrepreneur Award';
  if (lower.includes('lifetime') || lower.includes('literary')) return 'Lifetime Literary Achievement Award';
  if (lower.includes('sahitya')) return 'Sahitya Sewa Ratna Sammaan';
  if (lower.includes('shiksha') || lower.includes('principal')) return 'Shiksha Ratna Principal Award';
  if (lower.includes('bibhuti')) return 'Bibhuti Puraskar';
  if (lower.includes('laureate')) return 'Laureate Award Certificate';
  if (lower.includes('women') || lower.includes('icon')) return 'Women Icon Award';
  return templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getAwardCategory = (templateId) => {
  const lower = String(templateId || '').toLowerCase();
  if (lower.includes('ashok') || lower.includes('gaurav') || lower.includes('padm') || lower.includes('bhushan') || lower.includes('samaj')) {
    return 'National Honors';
  }
  if (lower.includes('business') || lower.includes('enterpreneur') || lower.includes('entrepreneur') || lower.includes('icon')) {
    return 'Business & Excellence';
  }
  if (lower.includes('doctorate') || lower.includes('shiksha') || lower.includes('laureate')) {
    return 'Academic & Honorary';
  }
  if (lower.includes('sahitya') || lower.includes('literary') || lower.includes('bibhuti')) {
    return 'Literary & Cultural';
  }
  return 'General Excellence';
};

// ── Template list ────────────────────────────────────────────────────────────
export const getAvailableTemplates = () => {
  const tDir = getTemplatesDir();
  if (!fs.existsSync(tDir)) return [];
  try {
    const files = fs.readdirSync(tDir);
    // Explicit curated list with priority ordering
    const priorityIds = [
      'Bhartiye Ashok Samman',
      'Best Business Icon Award',
      'rashtriya padma bhushan samman',
      'Bhartiye Gaurav Ratan Samman',
      'INTERNATIONAL BUSINESS EXCELLENCE AWARD',
      'Doctorate IHREO',
      'Bhartiya Samaj Seva award',
      'International Best Enterpreneur',
      'Lifetime Literary Achivement Award',
      'Sahitya Sewa Ratna Sammaan',
      'Shiksha Ratna Principal Award',
      'women icon award',
      'bibhuti puraskar',
      'laureate Certificate IHREO'
    ];

    const foundFiles = files
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf') || f.endsWith('.jpg'))
      .filter((f) => !f.startsWith('universal-') && !f.includes('SANDHYA') && !f.includes('KAWALJEET') && !f.includes('MEHA') && !f.includes('(1)'));

    const items = [];
    const seenIds = new Set();

    // First add priority templates if files exist
    for (const pid of priorityIds) {
      const match = foundFiles.find((f) => path.basename(f, path.extname(f)) === pid);
      if (match && !seenIds.has(pid)) {
        seenIds.add(pid);
        items.push({
          id: pid,
          filename: match,
          label: getAwardTitle(pid),
          category: getAwardCategory(pid),
          hasConfig: true,
          previewUrl: `/assets/certificate-templates/${encodeURIComponent(pid)}.png`
        });
      }
    }

    // Add any remaining templates
    foundFiles.forEach((filename) => {
      const id = path.basename(filename, path.extname(filename));
      if (!seenIds.has(id) && id !== 'Bhartiya Padma Bhushan Samman') { // alias of rashtriya padma bhushan samman
        seenIds.add(id);
        items.push({
          id,
          filename,
          label: getAwardTitle(id),
          category: getAwardCategory(id),
          hasConfig: true,
          previewUrl: `/assets/certificate-templates/${encodeURIComponent(id)}.png`
        });
      }
    });

    return items;
  } catch (err) {
    console.error('Error scanning templates:', err);
    return [
      { id: 'Bhartiye Ashok Samman', filename: 'Bhartiye Ashok Samman.pdf', label: 'Bhartiye Ashok Samman', category: 'National Honors', hasConfig: true },
      { id: 'Best Business Icon Award', filename: 'Best Business Icon Award.pdf', label: 'Best Business Icon Award', category: 'Business & Excellence', hasConfig: true },
      { id: 'rashtriya padma bhushan samman', filename: 'rashtriya padma bhushan samman.pdf', label: 'Bhartiya Padma Bhushan Samman', category: 'National Honors', hasConfig: true },
      { id: 'Bhartiye Gaurav Ratan Samman', filename: 'Bhartiye Gaurav Ratan Samman.pdf', label: 'Bhartiye Gaurav Ratan Samman', category: 'National Honors', hasConfig: true },
      { id: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD', filename: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD.pdf', label: 'International Business Excellence Award', category: 'Business & Excellence', hasConfig: true },
      { id: 'Doctorate IHREO', filename: 'Doctorate IHREO.pdf', label: 'Honorary Doctorate Award', category: 'Academic & Honorary', hasConfig: true }
    ];
  }
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

// ── Embed photo helper with shape masking (rect / circle) & cover fitting ─────
const embedPhotoWithShape = async (pdfDoc, studentData, shape = 'rect', borderColor = '#333333', borderWidth = 2) => {
  if (!studentData.photoUrl) return null;
  try {
    const rawBuf = await getPhotoBuffer(studentData.photoUrl);
    if (!rawBuf || !rawBuf.length) return null;

    try {
      const { createCanvas, loadImage } = await import('canvas');
      const img = await loadImage(rawBuf);
      const w = img.width || 400;
      const h = img.height || 480;
      const size = Math.max(300, Math.max(w, h));
      const targetW = shape === 'circle' ? size : 300;
      const targetH = shape === 'circle' ? size : 340;
      const canvas = createCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d');

      if (shape === 'circle') {
        const cx = size / 2;
        const cy = size / 2;
        const radius = Math.max(10, size / 2 - Math.max(1, borderWidth));
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const scale = Math.max((radius * 2) / w, (radius * 2) / h);
        const dw = w * scale;
        const dh = h * scale;
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.restore();

        if (borderWidth > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.lineWidth = borderWidth * 2;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      } else {
        // Rectangular with rounded corners and cover fitting
        const radius = 10;
        const bw = Math.max(1, borderWidth);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bw, bw, targetW - bw * 2, targetH - bw * 2, radius);
        } else {
          ctx.rect(bw, bw, targetW - bw * 2, targetH - bw * 2);
        }
        ctx.closePath();
        ctx.save();
        ctx.clip();

        // Cover fit
        const imgAspect = w / h;
        const targetAspect = (targetW - bw * 2) / (targetH - bw * 2);
        let drawW, drawH, drawX, drawY;
        if (imgAspect > targetAspect) {
          drawH = targetH - bw * 2;
          drawW = drawH * imgAspect;
          drawX = bw + (targetW - bw * 2 - drawW) / 2;
          drawY = bw;
        } else {
          drawW = targetW - bw * 2;
          drawH = drawW / imgAspect;
          drawX = bw;
          drawY = bw + (targetH - bw * 2 - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        if (borderWidth > 0) {
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

// ── RENDER SPECIFIC CERTIFICATE TEMPLATES ────────────────────────────────────

// 1. Bhartiye Ashok Samman Render (Matches Reference Image 2 Exactly)
const renderAshokSammanDoc = async (baseDoc, page, studentData, customDomain, templateName = 'Bhartiye Ashok Samman') => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left Registration details
  const refText = `CIN NO. : U85499DL2025NPL459383\nLicence No. : 176566\nSL No. : ${cleanRefno}\nReg No. : 459383`;
  page.drawText(refText, {
    x: 72,
    y: pH - 90,
    size: 7.2,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12),
    lineHeight: 11
  });

  // 2. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 535,
      y: pH - (70 + 72),
      width: 72,
      height: 72
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Center Recipient Photo (Inside double gold frame)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#cda250', 2);
  if (pImg) {
    page.drawImage(pImg, {
      x: 282,
      y: pH - (565 + 133),
      width: 118,
      height: 133
    });
  }

  // 4. Recipient Full Name (Line 1)
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 22;
  while (nameSize > 12 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 360) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 724,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  // 5. Subtitle: "And is honored with the title" (Line 2)
  const subText = 'And is honored with the title';
  const subW = fontTimes.widthOfTextAtSize(subText, 13);
  page.drawText(subText, {
    x: (pW - subW) / 2,
    y: pH - 748,
    size: 13,
    font: fontTimes,
    color: rgb(0.15, 0.15, 0.15)
  });

  // 6. Award Title Highlight in Quotes: “Bhartiye Ashok Samman” (Line 3, Rich Crimson Bold)
  const titleHighlight = '“Bhartiye Ashok Samman”';
  const thW = fontTimesBold.widthOfTextAtSize(titleHighlight, 17);
  page.drawText(titleHighlight, {
    x: (pW - thW) / 2,
    y: pH - 772,
    size: 17,
    font: fontTimesBold,
    color: rgb(0.55, 0.12, 0.06) // Rich crimson/maroon #8B1E0F
  });

  // 7. Category / Citation text (Lines 4 & 5, Balanced 2 Lines)
  const catField = studentData.category || 'social welfare';
  let line1 = `For his exceptional ${catField.toLowerCase().startsWith('social') ? catField : 'work in ' + catField}, notable accomplishments,`;
  let line2 = 'and significant contributions towards the progress of the nation.';
  if (line1.length > 68) {
    const words = `For his exceptional work in ${catField}, notable accomplishments, and significant contributions towards the progress of the nation.`.split(' ');
    line1 = '';
    line2 = '';
    for (const w of words) {
      if (fontTimes.widthOfTextAtSize(line1 + ' ' + w, 11) < 420 && !line2) {
        line1 = line1 ? line1 + ' ' + w : w;
      } else {
        line2 = line2 ? line2 + ' ' + w : w;
      }
    }
  }
  const l1w = fontTimes.widthOfTextAtSize(line1, 11);
  page.drawText(line1, {
    x: (pW - l1w) / 2,
    y: pH - 796,
    size: 11,
    font: fontTimes,
    color: rgb(0.18, 0.18, 0.18)
  });
  if (line2) {
    const l2w = fontTimes.widthOfTextAtSize(line2, 11);
    page.drawText(line2, {
      x: (pW - l2w) / 2,
      y: pH - 812,
      size: 11,
      font: fontTimes,
      color: rgb(0.18, 0.18, 0.18)
    });
  }

  // 8. Date of Issue (Single, perfectly placed above MSME seal)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontHelv.widthOfTextAtSize(dateStr, 10.5);
  page.drawText(dateStr, {
    x: (pW - dw) / 2,
    y: pH - 840,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// 2. Bhartiye Gaurav Ratan Samman Render
const renderGauravRatanDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left Registration details
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No. : 176556\nSl. No. ${cleanRefno}\nReg No. 459383`;
  page.drawText(refText, {
    x: 75,
    y: pH - 122,
    size: 7.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12),
    lineHeight: 12
  });

  // 2. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 525,
      y: pH - (100 + 72),
      width: 72,
      height: 72
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Center Recipient Photo (Inside rounded gold frame)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#cda250', 2.5);
  if (pImg) {
    page.drawImage(pImg, {
      x: 255,
      y: pH - (560 + 196),
      width: 172,
      height: 196
    });
  }

  // 4. Recipient Full Name
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 22;
  while (nameSize > 12 && fontTimesBold.widthOfTextAtSize(nameStr, nameSize) > 340) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 783,
    size: nameSize,
    font: fontTimesBold,
    color: rgb(0.08, 0.08, 0.08)
  });

  // 5. Subtitle: "And is honored with the title"
  const subText = 'And is honored with the title';
  const subW = fontTimes.widthOfTextAtSize(subText, 13);
  page.drawText(subText, {
    x: (pW - subW) / 2,
    y: pH - 810,
    size: 13,
    font: fontTimes,
    color: rgb(0.15, 0.15, 0.15)
  });

  // 6. Award Title Highlight in Quotes: “Bhartiye Gaurav Ratan Samman” (Deep Green Bold)
  const titleHighlight = '“Bhartiye Gaurav Ratan Samman”';
  const thW = fontTimesBold.widthOfTextAtSize(titleHighlight, 17);
  page.drawText(titleHighlight, {
    x: (pW - thW) / 2,
    y: pH - 836,
    size: 17,
    font: fontTimesBold,
    color: rgb(0.12, 0.35, 0.15) // Rich forest green #1e5422
  });

  // 7. Category / Citation text
  const catField = studentData.category || 'Wild Life Expert';
  const line1 = `For his exceptional work as a ${catField}, notable accomplishments,`;
  const line2 = 'and significant contributions towards the progress of the nation.';
  const l1w = fontTimes.widthOfTextAtSize(line1, 11.5);
  page.drawText(line1, {
    x: (pW - l1w) / 2,
    y: pH - 863,
    size: 11.5,
    font: fontTimes,
    color: rgb(0.18, 0.18, 0.18)
  });
  if (line2) {
    const l2w = fontTimes.widthOfTextAtSize(line2, 11.5);
    page.drawText(line2, {
      x: (pW - l2w) / 2,
      y: pH - 881,
      size: 11.5,
      font: fontTimes,
      color: rgb(0.18, 0.18, 0.18)
    });
  }

  // 8. Date of Issue (Single crisp line)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontHelv.widthOfTextAtSize(dateStr, 10.5);
  page.drawText(dateStr, {
    x: (pW - dw) / 2,
    y: pH - 905,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// 3. Bhartiya Padma Bhushan Samman Render (Circular Laurel & Gold Ribbon)
const renderPadmaBhushanDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 140 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 558,
      y: pH - (90 + 70),
      width: 70,
      height: 70
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 2. Circular Photo inside Gold Laurel Wreath
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#c49a45', 2);
  if (pImg) {
    const r = 70;
    page.drawImage(pImg, {
      x: 361 - r,
      y: pH - (340 + r),
      width: r * 2,
      height: r * 2
    });
  }

  // 3. Golden Ribbon Banner Recipient Name (Centered on ribbon)
  const nameStr = studentData.fullName || 'Recipient Name';
  let ribSize = 14;
  while (ribSize > 9 && fontTimesBold.widthOfTextAtSize(nameStr, ribSize) > 175) {
    ribSize -= 0.5;
  }
  const rw = fontTimesBold.widthOfTextAtSize(nameStr, ribSize);
  page.drawText(nameStr, {
    x: 361 - (rw / 2),
    y: pH - 434,
    size: ribSize,
    font: fontTimesBold,
    color: rgb(0.18, 0.1, 0.04)
  });

  // 4. Category in Citation (Under "contributions and dedication in the field of")
  const cat = studentData.category || 'Social Work';
  const cw = fontTimesBold.widthOfTextAtSize(cat, 14.5);
  page.drawText(cat, {
    x: 361 - (cw / 2),
    y: pH - 612,
    size: 14.5,
    font: fontTimesBold,
    color: rgb(0.7, 0.35, 0.05)
  });

  // 5. Large Recipient Name in body (Under "this award of honour and recognition is presented to")
  let bodyNameSize = 25;
  while (bodyNameSize > 14 && fontTimesBold.widthOfTextAtSize(nameStr, bodyNameSize) > 380) {
    bodyNameSize -= 0.5;
  }
  const bw = fontTimesBold.widthOfTextAtSize(nameStr, bodyNameSize);
  page.drawText(nameStr, {
    x: (pW - bw) / 2,
    y: pH - 672,
    size: bodyNameSize,
    font: fontTimesBold,
    color: rgb(0.08, 0.08, 0.08)
  });

  // 6. Date formatted (Under "for betterment of society")
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MMM-YYYY');
  const dw = fontHelv.widthOfTextAtSize(dateFormatted, 12.5);
  page.drawText(dateFormatted, {
    x: (pW - dw) / 2,
    y: pH - 728,
    size: 12.5,
    font: fontHelv,
    color: rgb(0.12, 0.12, 0.12)
  });
};

// 4. Best Business Icon Award Render (Circular Laurel & Navy Ribbon)
const renderBusinessIconDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  const cx = Math.round(pW / 2); // 348 for 696w, 356 for 713w
  const cy = 500;
  const r = 101;

  // 1. Top Left Registration details
  const refText = `CIN NO. : U85499DL2025NPL459383\nLicence No. : 765686\nSL No. : ${cleanRefno}\nReg No. : 459383`;
  page.drawText(refText, {
    x: 52,
    y: pH - 96,
    size: 7.2,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12),
    lineHeight: 11
  });

  // 2. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 560,
      y: pH - (80 + 72),
      width: 72,
      height: 72
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Circular Photo inside Large Laurel Wreath
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#c49a45', 2.5);
  if (pImg) {
    page.drawImage(pImg, {
      x: cx - r,
      y: pH - (cy + r),
      width: r * 2,
      height: r * 2
    });
  }

  // 4. Navy Blue 3D Ribbon Banner Recipient Name
  const nameStr = studentData.fullName || 'Recipient Name';
  let ribSize = 28;
  while (ribSize > 12 && fontTimesBold.widthOfTextAtSize(nameStr, ribSize) > 310) {
    ribSize -= 0.5;
  }
  const nw = fontTimesBold.widthOfTextAtSize(nameStr, ribSize);
  page.drawText(nameStr, {
    x: cx - (nw / 2),
    y: pH - 639,
    size: ribSize,
    font: fontTimesBold,
    color: rgb(0.97, 0.9, 0.62) // Luxurious gold/cream text on navy banner
  });
};

// 5. International Business Excellence Award Render (Globe & Underline)
const renderInternationalBusinessDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesBoldItalic = await baseDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await baseDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left Registration details
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${cleanRefno}\nReg No. 459383`;
  page.drawText(refText, {
    x: 95,
    y: pH - 118,
    size: 7.5,
    font: fontHelvBold,
    color: rgb(0.12, 0.12, 0.12),
    lineHeight: 12
  });

  // 2. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 140 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 575,
      y: pH - (87 + 70),
      width: 70,
      height: 70
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Recipient Photo inside Slot (Cover fitted with rounded corners)
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#444444', 1.5);
  if (pImg) {
    page.drawImage(pImg, {
      x: 312,
      y: pH - (356 + 130),
      width: 110,
      height: 130
    });
  }

  // 4. Recipient Name on Underline (Dr. Mahendran G in bold italic serif)
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 25;
  while (nameSize > 12 && fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize) > 360) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: 412 - (nw / 2),
    y: pH - 549,
    size: nameSize,
    font: fontTimesBoldItalic,
    color: rgb(0.17, 0.11, 0.09) // Warm rich dark brown #2b1b17
  });

  // 5. Date of Issue (Single crisp line centered at x=366)
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YY');
  const dateStr = `Date of Issue : ${dateFormatted}`;
  const dw = fontHelv.widthOfTextAtSize(dateStr, 10.5);
  page.drawText(dateStr, {
    x: 366 - (dw / 2),
    y: pH - 860,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// 6. Arya Bhushan Samaj Seva Award / Bhartiya Samaj Seva Award Render
const renderSamajSevaDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBoldItalic = await baseDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 140 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 575,
      y: pH - (85 + 70),
      width: 70,
      height: 70
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 2. Recipient Name on Underline
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 25;
  while (nameSize > 12 && fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize) > 380) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: 417 - (nw / 2),
    y: pH - 540,
    size: nameSize,
    font: fontTimesBoldItalic,
    color: rgb(0.17, 0.11, 0.09) // Warm dark brown
  });

  // 3. Date of Issue
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YYYY');
  page.drawText(dateFormatted, {
    x: 460,
    y: pH - 860,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// 7. Women Icon Award Render (Circular Ornate Frame)
const renderWomenIconDoc = async (baseDoc, page, studentData, customDomain) => {
  const { width: pW, height: pH } = page.getSize();
  const fontTimesBoldItalic = await baseDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 140 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, {
      x: 545,
      y: pH - (75 + 70),
      width: 70,
      height: 70
    });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 2. Circular Photo inside Ornate Gold Frame
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'circle', '#c49a45', 2.5);
  if (pImg) {
    const cx = Math.round(pW / 2);
    const cy = 460;
    const r = 85;
    page.drawImage(pImg, {
      x: cx - r,
      y: pH - (cy + r),
      width: r * 2,
      height: r * 2
    });
  }

  // 3. Recipient Name on Underline
  const nameStr = studentData.fullName || 'Recipient Name';
  let nameSize = 24;
  while (nameSize > 12 && fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize) > 360) {
    nameSize -= 0.5;
  }
  const nw = fontTimesBoldItalic.widthOfTextAtSize(nameStr, nameSize);
  page.drawText(nameStr, {
    x: (pW - nw) / 2,
    y: pH - 730,
    size: nameSize,
    font: fontTimesBoldItalic,
    color: rgb(0.08, 0.08, 0.08)
  });

  // 4. Date of Issue
  const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YYYY');
  page.drawText(dateFormatted, {
    x: 420,
    y: pH - 824,
    size: 10.5,
    font: fontHelv,
    color: rgb(0.1, 0.1, 0.1)
  });
};

// 8. Classic Vector Templates Render (Doctorate, etc.)
const renderClassicVectorDoc = async (baseDoc, page, studentData, templateId, customDomain) => {
  const { width: cW } = page.getSize();
  const fontTimes = await baseDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await baseDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontHelv = await baseDoc.embedFont(StandardFonts.Helvetica);

  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left CIN, Licence & Sl. No., Reg No.
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${cleanRefno}\nReg No. 459383`;
  page.drawText(refText, {
    x: 65, y: 775, size: 7.5, font: fontHelv, color: rgb(0.12, 0.12, 0.12), lineHeight: 10
  });

  // 2. Top Right QR Code
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
    const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 150 });
    const qrImg = await baseDoc.embedPng(qrBuf);
    page.drawImage(qrImg, { x: 450, y: 715, width: 72, height: 72 });
  } catch (qrErr) {
    console.warn('QR Code generation error:', qrErr.message);
  }

  // 3. Award Title inside Top Capsule
  const titleStr = getAwardTitle(templateId);
  const tw = fontTimes.widthOfTextAtSize(titleStr, 23.5);
  page.drawText(titleStr, {
    x: (cW - tw) / 2,
    y: 504,
    size: 23.5,
    font: fontTimes,
    color: rgb(0.1, 0.1, 0.1)
  });

  // 4. Recipient Photo inside Center Slot
  const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#222222', 1.5);
  if (pImg) {
    page.drawImage(pImg, { x: 253.66, y: 377.78, width: 88.01, height: 95.05 });
  }

  // 5. Recipient Name inside Bottom Capsule
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

  // 6. Award Category
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

  // 7. Honoris causa
  const honorisText = 'Honoris causa with all rights and privileges there into pertaining';
  const hw = fontTimes.widthOfTextAtSize(honorisText, 10.5);
  page.drawText(honorisText, {
    x: (cW - hw) / 2,
    y: 176,
    size: 10.5,
    font: fontTimes,
    color: rgb(0.15, 0.15, 0.15)
  });

  // 8. Date of Issue
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

// ── Master Dispatcher: Render PDF ───────────────────────────────────────────
export const renderIhreDocPdf = async (studentData, templateId, customDomain) => {
  let pdfTemplatePath = findTemplateFile(templateId, ['.pdf', '.png']) || findTemplateFile('Doctorate IHREO', ['.pdf']);
  if (!pdfTemplatePath || !fs.existsSync(pdfTemplatePath)) {
    throw new Error(`Base PDF template not found for ${templateId}`);
  }

  let baseDoc;
  if (pdfTemplatePath.endsWith('.png') || pdfTemplatePath.endsWith('.jpg')) {
    baseDoc = await PDFDocument.create();
    const imgBytes = fs.readFileSync(pdfTemplatePath);
    const embeddedImg = pdfTemplatePath.endsWith('.png') ? await baseDoc.embedPng(imgBytes) : await baseDoc.embedJpg(imgBytes);
    const page = baseDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
  } else {
    baseDoc = await PDFDocument.load(fs.readFileSync(pdfTemplatePath));
  }

  const page = baseDoc.getPage(0);
  const lowerId = String(templateId || '').toLowerCase();

  if (lowerId.includes('ashok')) {
    await renderAshokSammanDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('gaurav') || lowerId.includes('ratan')) {
    await renderGauravRatanDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('padm') || lowerId.includes('bhushan')) {
    await renderPadmaBhushanDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('icon') && lowerId.includes('business')) {
    await renderBusinessIconDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('business') && lowerId.includes('excellence')) {
    await renderInternationalBusinessDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('samaj') || lowerId.includes('arya')) {
    await renderSamajSevaDoc(baseDoc, page, studentData, customDomain);
  } else if (lowerId.includes('women') || (lowerId.includes('icon') && !lowerId.includes('business'))) {
    await renderWomenIconDoc(baseDoc, page, studentData, customDomain);
  } else {
    await renderClassicVectorDoc(baseDoc, page, studentData, templateId, customDomain);
  }

  return await baseDoc.save();
};

// ── Award Certificate Generator (PDF + High Res PNG) ─────────────────────────
export const generateCertificate = async (studentData, templateId, customDomain) => {
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_002').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-${sanitize(templateId)}`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);

  try {
    const pdfBytes = await renderIhreDocPdf(studentData, templateId, customDomain);
    fs.writeFileSync(pdfPath, pdfBytes);

    // Also generate PNG representation from base template + canvas for immediate web previews
    try {
      const basePngPath = findTemplateFile(templateId, ['.png']);
      if (basePngPath && fs.existsSync(basePngPath)) {
        const { createCanvas, loadImage } = await import('canvas');
        const bgImg = await loadImage(basePngPath);
        const canvas = createCanvas(bgImg.width, bgImg.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bgImg, 0, 0);

        const lowerId = templateId.toLowerCase();
        const recipientName = studentData.fullName || 'Recipient Name';
        const category = studentData.category || 'For Outstanding Distinction & Excellence';

        // 1. Render Recipient Photo
        if (studentData.photoUrl) {
          const rawBuf = await getPhotoBuffer(studentData.photoUrl);
          if (rawBuf) {
            const pImg = await loadImage(rawBuf);
            const pw = pImg.width || 400;
            const ph = pImg.height || 480;

            if (lowerId.includes('padm') || lowerId.includes('bhushan')) {
              const cx = 362, cy = 340, r = 71;
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              const scale = Math.max((r * 2) / pw, (r * 2) / ph);
              const dw = pw * scale, dh = ph * scale;
              ctx.drawImage(pImg, cx - dw / 2, cy - dh / 2, dw, dh);
              ctx.restore();

              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.lineWidth = 2.5;
              ctx.strokeStyle = '#c49a45';
              ctx.stroke();
            } else if (lowerId.includes('icon') && lowerId.includes('business')) {
              const cx = Math.round(canvas.width / 2);
              const cy = 502, r = 105;
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              const scale = Math.max((r * 2) / pw, (r * 2) / ph);
              const dw = pw * scale, dh = ph * scale;
              ctx.drawImage(pImg, cx - dw / 2, cy - dh / 2, dw, dh);
              ctx.restore();

              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.lineWidth = 3;
              ctx.strokeStyle = '#c49a45';
              ctx.stroke();
            } else if (lowerId.includes('women') || (lowerId.includes('icon') && !lowerId.includes('business'))) {
              const cx = Math.round(canvas.width / 2);
              const cy = 460, r = 85;
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              const scale = Math.max((r * 2) / pw, (r * 2) / ph);
              const dw = pw * scale, dh = ph * scale;
              ctx.drawImage(pImg, cx - dw / 2, cy - dh / 2, dw, dh);
              ctx.restore();

              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.lineWidth = 2.5;
              ctx.strokeStyle = '#c49a45';
              ctx.stroke();
            } else if (lowerId.includes('ashok')) {
              ctx.drawImage(pImg, 280, 563, 122, 137);
            } else if (lowerId.includes('gaurav')) {
              const px = 255, py = 560, pw = 172, ph = 196, radius = 10;
              ctx.save();
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, radius);
              else ctx.rect(px, py, pw, ph);
              ctx.closePath();
              ctx.clip();
              const scaleFit = Math.max(pw / pImg.width, ph / pImg.height);
              const dw = pImg.width * scaleFit, dh = pImg.height * scaleFit;
              ctx.drawImage(pImg, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
              ctx.restore();

              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, radius);
              else ctx.rect(px, py, pw, ph);
              ctx.lineWidth = 2.5;
              ctx.strokeStyle = '#cda250';
              ctx.stroke();
            } else if (lowerId.includes('business')) {
              const px = 312, py = 356, pw = 110, ph = 130, radius = 6;
              ctx.save();
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, radius);
              else ctx.rect(px, py, pw, ph);
              ctx.closePath();
              ctx.clip();
              const scaleFit = Math.max(pw / pImg.width, ph / pImg.height);
              const dw = pImg.width * scaleFit, dh = pImg.height * scaleFit;
              ctx.drawImage(pImg, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
              ctx.restore();

              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, radius);
              else ctx.rect(px, py, pw, ph);
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = '#444444';
              ctx.stroke();
            }
          }
        }

        // 2. Render Text Overlays
        ctx.textAlign = 'center';
        if (lowerId.includes('icon') && lowerId.includes('business')) {
          const cx = Math.round(canvas.width / 2);
          // Name on ribbon
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 28px "Times New Roman", serif';
          ctx.fillStyle = '#f8e6a0';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetY = 1;
          ctx.fillText(recipientName, cx, 645);
          ctx.shadowColor = 'transparent';
        } else if (lowerId.includes('padm') || lowerId.includes('bhushan')) {
          ctx.font = 'bold 14px "Times New Roman", serif';
          ctx.fillStyle = '#2a1a08';
          ctx.fillText(recipientName, 362, 434);

          ctx.font = 'bold 14.5px "Times New Roman", serif';
          ctx.fillStyle = '#b45309';
          ctx.fillText(category, 362, 612);

          ctx.font = 'bold 26px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(recipientName, 362, 672);

          ctx.font = 'bold 13px Helvetica, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(studentData.letterIssuedAt || '26-Dec-2025', 362, 728);
        } else if (lowerId.includes('samaj') || lowerId.includes('arya')) {
          // Recipient Name on Underline
          ctx.textAlign = 'center';
          ctx.font = 'italic bold 25px "Times New Roman", serif';
          ctx.fillStyle = '#2b1b17';
          ctx.fillText(recipientName, 417, 540);

          // Date of Issue
          const sDate = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YYYY');
          ctx.font = '10.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(sDate, 460, 860);
        } else if (lowerId.includes('women') || (lowerId.includes('icon') && !lowerId.includes('business'))) {
          // Recipient Name on Underline
          ctx.textAlign = 'center';
          ctx.font = 'italic bold 24px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(recipientName, 341, 730);

          // Date of Issue
          const wDate = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YYYY');
          ctx.font = '10.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(wDate, 420, 824);
        } else if (lowerId.includes('ashok')) {
          ctx.font = 'bold 22px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(recipientName, 341, 724);

          ctx.font = '13px "Times New Roman", serif';
          ctx.fillStyle = '#222222';
          ctx.fillText('And is honored with the title', 341, 748);

          ctx.font = 'bold 17px "Times New Roman", serif';
          ctx.fillStyle = '#8B1E0F';
          ctx.fillText('“Bhartiye Ashok Samman”', 341, 772);

          ctx.font = '11px "Times New Roman", serif';
          ctx.fillStyle = '#222222';
          ctx.fillText(`For his exceptional ${category.toLowerCase().startsWith('social') ? category : 'work in ' + category}, notable accomplishments,`, 341, 796);
          ctx.fillText('and significant contributions towards the progress of the nation.', 341, 812);

          const dateStr = `Date of Issue : ${studentData.letterIssuedAt || '26-12-2025'}`;
          ctx.font = '10.5px Helvetica, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(dateStr, 341, 840);
        } else if (lowerId.includes('gaurav')) {
          // Center Text
          ctx.textAlign = 'center';
          ctx.font = 'bold 22px "Times New Roman", serif';
          ctx.fillStyle = '#111827';
          ctx.fillText(recipientName, 341, 783);

          ctx.font = '13px "Times New Roman", serif';
          ctx.fillStyle = '#222222';
          ctx.fillText('And is honored with the title', 341, 810);

          ctx.font = 'bold 17px "Times New Roman", serif';
          ctx.fillStyle = '#1e5422';
          ctx.fillText('“Bhartiye Gaurav Ratan Samman”', 341, 836);

          ctx.font = '11.5px "Times New Roman", serif';
          ctx.fillStyle = '#222222';
          ctx.fillText(`For his exceptional work as a ${category}, notable accomplishments,`, 341, 863);
          ctx.fillText('and significant contributions towards the progress of the nation.', 341, 881);

          const dateStr = `Date of Issue : ${studentData.letterIssuedAt || '26-12-2025'}`;
          ctx.font = '10.5px Helvetica, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(dateStr, 341, 896);
        } else if (lowerId.includes('business')) {
          // Recipient Name on Underline
          ctx.textAlign = 'center';
          ctx.font = 'italic bold 25px "Times New Roman", serif';
          ctx.fillStyle = '#2b1b17';
          ctx.fillText(recipientName, 412, 549);

          // Date of Issue
          const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD/MM/YY');
          const dateStr = `Date of Issue : ${dateFormatted}`;
          ctx.font = '10.5px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(dateStr, 366, 860);
        }

        // 3. Render QR Code on canvas
        try {
          const domain = resolveAppDomain(customDomain);
          const cleanCertNo = String(studentData.certificateNumber || cleanRef.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');
          const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
          const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 140 });
          const qrImg = await loadImage(qrBuf);
          if (lowerId.includes('ashok') || lowerId.includes('gaurav')) {
            ctx.drawImage(qrImg, 535, 75, 72, 72);
          } else if (lowerId.includes('padm')) {
            ctx.drawImage(qrImg, 558, 90, 70, 70);
          } else if (lowerId.includes('icon') && lowerId.includes('business')) {
            ctx.drawImage(qrImg, 575, 80, 70, 70);
          } else if (lowerId.includes('business')) {
            ctx.drawImage(qrImg, 575, 87, 70, 70);
          } else if (lowerId.includes('samaj') || lowerId.includes('arya')) {
            ctx.drawImage(qrImg, 575, 85, 70, 70);
          } else if (lowerId.includes('women') || lowerId.includes('icon')) {
            ctx.drawImage(qrImg, 545, 75, 70, 70);
          }
        } catch {}

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
    pdfUrl: `/uploads/certificates/${name}.pdf`
  };
};

// ── Universal ID Card ────────────────────────────────────────────────────────
export const generateIdCard = async (studentData, customDomain) => {
  const templateId = 'universal-id-card';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRef.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-id-card`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);

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
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#222222', 1);
    if (pImg) {
      page.drawImage(pImg, { x: 14.41, y: 38.12, width: 37.71, height: 41.59 });
    }

    // 4. Dynamic Fields (Name, Designation, Nationality, Date)
    const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');

    page.drawText(`: ${studentData.fullName || 'Member Name'}`, { x: 114, y: 70, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${studentData.designation || 'National Member'}`, { x: 114, y: 58, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${studentData.nationality || 'Indian'}`, { x: 114, y: 46, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`: ${dateFormatted}`, { x: 114, y: 35, size: 7.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

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
export const generateMembershipCert = async (studentData, customDomain) => {
  const templateId = 'universal-membership-certificate';
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRef.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-membership`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);

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
    } catch (qrErr) {
      console.warn('Membership QR Code error:', qrErr.message);
    }

    // 3. Recipient Photo inside Center Slot
    const pImg = await embedPhotoWithShape(baseDoc, studentData, 'rect', '#222222', 1.5);
    if (pImg) {
      page.drawImage(pImg, { x: 254.63, y: 360.09, width: 88.06, height: 99.58 });
    }

    // 4. Recipient Name inside Bottom Capsule
    const rawName = studentData.fullName || studentData.name || studentData.studentName || studentData.recipientName || 'Member Name';
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

    // 5. Date of Issue
    const dateFormatted = formatIssueDate(studentData.letterIssuedAt, 'DD-MM-YYYY');
    const dateStr = `Date of Issue : ${dateFormatted}`;
    const dw = fontHelv.widthOfTextAtSize(dateStr, 9.0);
    page.drawText(dateStr, {
      x: (mW - dw) / 2,
      y: 181.0,
      size: 9.0,
      font: fontHelv,
      color: rgb(0.12, 0.12, 0.12)
    });

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
