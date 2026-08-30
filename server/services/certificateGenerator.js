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

// ── Robust Photo Fetcher & Embedder Helper ────────────────────────────────────
const getPhotoBuffer = async (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') return null;

  const trimmed = photoUrl.trim();

  // 1. Data URI / Base64 format
  if (trimmed.startsWith('data:')) {
    try {
      const commaIdx = trimmed.indexOf(',');
      const b64 = commaIdx !== -1 ? trimmed.slice(commaIdx + 1) : trimmed;
      // Handle URL-encoded base64 and whitespace
      const cleanB64 = decodeURIComponent(b64).replace(/\s+/g, '').replace(/ /g, '+');
      return Buffer.from(cleanB64, 'base64');
    } catch (e) {
      console.warn('Base64 parse warning:', e.message);
    }
  }

  // 2. Raw Base64 string (without data: prefix)
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

  // 4. Local / Serverless filesystem paths
  const relPath = trimmed.replace(/^\//, '');
  const candidatePaths = [
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

// ── Embed photo helper with rounded corners & clean border ───────────────────
const embedPhoto = async (pdfDoc, studentData) => {
  if (!studentData.photoUrl) return null;
  try {
    const rawBuf = await getPhotoBuffer(studentData.photoUrl);
    if (!rawBuf || !rawBuf.length) {
      console.warn('Could not retrieve photo buffer for student:', studentData.fullName);
      return null;
    }

    // Strategy 1: Canvas (High fidelity rendering with rounded corners & dark border)
    try {
      const { createCanvas, loadImage } = await import('canvas');
      const img = await loadImage(rawBuf);
      const w = img.width || 400;
      const h = img.height || 480;
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');

      const radius = Math.min(w, h) * 0.08;
      const strokeWidth = Math.max(3, Math.min(w, h) * 0.016);

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(strokeWidth / 2, strokeWidth / 2, w - strokeWidth, h - strokeWidth, radius);
      } else {
        const r = radius, cw = w - strokeWidth, ch = h - strokeWidth, ox = strokeWidth / 2, oy = strokeWidth / 2;
        ctx.moveTo(ox + r, oy);
        ctx.lineTo(ox + cw - r, oy);
        ctx.quadraticCurveTo(ox + cw, oy, ox + cw, oy + r);
        ctx.lineTo(ox + cw, oy + ch - r);
        ctx.quadraticCurveTo(ox + cw, oy + ch, ox + cw - r, oy + ch);
        ctx.lineTo(ox + r, oy + ch);
        ctx.quadraticCurveTo(ox, oy + ch, ox, oy + ch - r);
        ctx.lineTo(ox, oy + r);
        ctx.quadraticCurveTo(ox, oy, ox + r, oy);
      }
      ctx.closePath();

      ctx.save();
      ctx.clip();
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = '#222222';
      ctx.stroke();

      const roundedBuf = canvas.toBuffer('image/png');
      return await pdfDoc.embedPng(roundedBuf);
    } catch (canvasErr) {
      // Canvas not available or image decode error, fallback to pure JS pipeline
    }

    // Strategy 2: Pure JavaScript JPEG/PNG decoder + PNG encoder with rounded border
    try {
      let width = 0, height = 0, data = null;

      // Check if image is JPEG (magic bytes 0xFF 0xD8)
      if (rawBuf[0] === 0xFF && rawBuf[1] === 0xD8) {
        const jpeg = (await import('jpeg-js')).default;
        const decoded = jpeg.decode(rawBuf, { useTArray: true });
        width = decoded.width;
        height = decoded.height;
        data = decoded.data;
      } else if (rawBuf[0] === 0x89 && rawBuf[1] === 0x50) {
        // PNG magic bytes
        const { PNG } = await import('pngjs');
        const parsed = PNG.sync.read(rawBuf);
        width = parsed.width;
        height = parsed.height;
        data = parsed.data;
      }

      if (width > 0 && height > 0 && data) {
        const radius = Math.min(width, height) * 0.08;
        const strokeWidth = Math.max(2, Math.min(width, height) * 0.016);

        // Apply rounded corner clipping and border directly on pixel buffer
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let isOutside = false;
            let isBorder = false;

            let cx = -1, cy = -1;
            if (x < radius && y < radius) { cx = radius; cy = radius; }
            else if (x >= width - radius && y < radius) { cx = width - radius - 1; cy = radius; }
            else if (x < radius && y >= height - radius) { cx = radius; cy = height - radius - 1; }
            else if (x >= width - radius && y >= height - radius) { cx = width - radius - 1; cy = height - radius - 1; }

            if (cx !== -1) {
              const dist = Math.hypot(x - cx, y - cy);
              if (dist > radius) {
                isOutside = true;
              } else if (dist >= radius - strokeWidth) {
                isBorder = true;
              }
            } else {
              if (x < strokeWidth || x >= width - strokeWidth || y < strokeWidth || y >= height - strokeWidth) {
                isBorder = true;
              }
            }

            if (isOutside) {
              data[idx + 3] = 0; // Transparent
            } else if (isBorder) {
              data[idx] = 34;     // R
              data[idx + 1] = 34; // G
              data[idx + 2] = 34; // B
              data[idx + 3] = 255;// A
            }
          }
        }

        const { PNG } = await import('pngjs');
        const png = new PNG({ width, height });
        png.data = Buffer.from(data);
        const pngBuf = PNG.sync.write(png);
        return await pdfDoc.embedPng(pngBuf);
      }
    } catch (pureJsErr) {
      console.warn('Pure JS photo rounding fallback:', pureJsErr.message);
    }

    // Strategy 3: Direct pdf-lib embed fallback
    try {
      if (rawBuf[0] === 0xFF && rawBuf[1] === 0xD8) {
        return await pdfDoc.embedJpg(rawBuf);
      } else {
        return await pdfDoc.embedPng(rawBuf);
      }
    } catch (directErr) {
      try { return await pdfDoc.embedJpg(rawBuf); } catch {}
      try { return await pdfDoc.embedPng(rawBuf); } catch {}
    }
  } catch (e) {
    console.error('Fatal Photo Embed Error:', e);
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

// ── Render Authentic IHREO Vector PDF Base Certificate (Clean Superimposition) ──
export const renderIhreDocPdf = async (studentData, templateId, customDomain) => {
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

  // Normalize reference numbers to always display IHREO prefix
  const cleanRefno = String(studentData.refno || 'IHREO/2026/002').replace(/WCAEO/gi, 'IHREO');
  const cleanCertNo = String(studentData.certificateNumber || cleanRefno.replace('IHREO/', 'IHREO/CERT/') || 'IHREO/CERT/2026/0002').replace(/WCAEO/gi, 'IHREO');

  // 1. Top Left CIN, Licence & Sl. No., Reg No. (Clean Superimposition)
  const refText = `CIN NO:- U85499DL2025NPL459383\nLicence No:- 176566\nSl. No. ${cleanRefno}\nReg No. 459383`;
  page.drawText(refText, {
    x: 65, y: 775, size: 7.5, font: fontHelv, color: rgb(0.12, 0.12, 0.12), lineHeight: 10
  });

  // 2. Top Right QR Code (Clean Superimposition with ?cert= universal routing)
  try {
    const domain = resolveAppDomain(customDomain);
    const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
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
export const generateCertificate = async (studentData, templateId, customDomain) => {
  const sanitize = (s) => String(s).replace(/[\/\s:\\]/g, '_');
  const cleanRef = String(studentData.refno || 'IHREO_2026_002').replace(/WCAEO/gi, 'IHREO');
  const name = `${sanitize(cleanRef)}-${sanitize(templateId)}`;
  const pdfPath = path.join(uploadsDir, `${name}.pdf`);
  const pngPath = path.join(uploadsDir, `${name}.png`);
  try {
    const pdfBytes = await renderIhreDocPdf(studentData, templateId, customDomain);
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
    const pImg = await embedPhoto(baseDoc, studentData);
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

    // 1. Top Left CIN, Licence & Sl. No., Reg No. (Clean Superimposition)
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

    // 2. Top Right QR Code (Clean Superimposition with ?cert= universal routing)
    try {
      const domain = resolveAppDomain(customDomain);
      const verifyUrl = `${domain}/verify?cert=${encodeURIComponent(cleanCertNo)}`;
      const qrBuf = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, width: 120 });
      const qrImg = await baseDoc.embedPng(qrBuf);
      page.drawImage(qrImg, { x: 442.63, y: 686.92, width: 56.90, height: 56.90 });
    } catch (qrErr) {
      console.warn('Membership QR Code error:', qrErr.message);
    }

    // 3. Recipient Photo inside Center Slot with rounded corners & border
    const pImg = await embedPhoto(baseDoc, studentData);
    if (pImg) {
      page.drawImage(pImg, { x: 254.63, y: 360.09, width: 88.06, height: 99.58 });
    }

    // 4. Recipient Name inside Bottom Capsule (Clean Serif Typography, Perfectly Centered)
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

