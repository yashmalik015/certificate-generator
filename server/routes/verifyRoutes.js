import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Helper to render standalone mobile-responsive HTML for browser visitors
const renderHtmlVerification = ({ valid, status, student, message, query }) => {
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Extract registration number and serial number
  const rawRef = student?.refno || '';
  const regNo = rawRef ? rawRef.split('/')[0] : '459383';
  const slNo = rawRef || (student?.certificateNumber ? student.certificateNumber.replace('/CERT/', '/') : '459383/IHREO0201');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Certificate Verification | IHREO</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #ecefe6;
      background-image: radial-gradient(#d4dcd2 1px, transparent 1px);
      background-size: 20px 20px;
      color: #111111;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 12px;
    }

    .card {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border: 1.5px solid #222222;
      border-radius: 2px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
    }

    /* --- Reg numbers top bar --- */
    .reg-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px 6px;
      font-size: 15px;
      fontWeight: 600;
      color: #111111;
    }

    /* --- Org header --- */
    .org-header {
      text-align: center;
      padding: 6px 16px 12px;
    }
    .org-name {
      font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
      font-size: 25px;
      font-weight: 900;
      color: #0a0a0a;
      line-height: 1.18;
      margin: 0 0 3px 0;
    }
    .org-sub {
      font-size: 11px;
      color: #333333;
      font-weight: 500;
      margin: 0 0 12px 0;
      letter-spacing: 0.1px;
    }

    /* --- Award pill --- */
    .award-pill {
      display: inline-block;
      background: linear-gradient(180deg, #edf2f7 0%, #e2e8f0 100%);
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      padding: 5px 22px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .award-pill span {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.2px;
    }

    /* --- Main content area with watermark --- */
    .main-area {
      position: relative;
      padding: 10px 18px 24px;
      min-height: 380px;
    }
    .watermark {
      position: absolute;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 340px;
      height: 340px;
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }

    /* --- Photo --- */
    .photo-area {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: center;
      margin-bottom: 14px;
    }
    .photo-frame {
      width: 125px;
      height: 150px;
      border-radius: 8px;
      border: 1.5px solid #222222;
      background-color: #f8fafc;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 38px;
      color: #94a3b8;
    }

    /* --- Details text --- */
    .details-box {
      position: relative;
      z-index: 1;
      text-align: center;
      font-size: 16.5px;
      color: #111111;
      font-weight: 500;
      line-height: 1.75;
    }
    .name-line {
      font-size: 18px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 1px;
    }
    .date-line {
      margin-top: 14px;
      font-size: 17px;
      font-weight: 600;
      color: #000000;
    }

    /* --- Error state --- */
    .error-card {
      padding: 54px 24px;
      text-align: center;
    }
    .error-icon {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .error-title {
      font-size: 20px;
      font-weight: 700;
      color: #111111;
      margin-bottom: 8px;
    }
    .error-desc {
      color: #666666;
      font-size: 13.5px;
      max-width: 380px;
      margin: 0 auto;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    ${valid ? `
      <!-- Reg bar -->
      <div class="reg-bar">
        <span>Reg No. ${regNo}</span>
        <span>Sl. No. ${slNo}</span>
      </div>

      <!-- Org header -->
      <div class="org-header">
        <h1 class="org-name">Iconic Human Rights<br>& Educational Organisation</h1>
        <div class="org-sub">Approved by Ministry of Corporate Affairs, Government of India</div>
        <div class="award-pill">
          <span>${student?.category || 'Honorary Doctorate Award'}</span>
        </div>
      </div>

      <!-- Main area with watermark -->
      <div class="main-area">
        <!-- High-res SVG Logo Watermark -->
        <img class="watermark" src="/ihreo-logo.svg" onerror="this.src='/ihreo-logo.png'" alt="" />

        <!-- Photo -->
        <div class="photo-area">
          <div class="photo-frame">
            ${student?.photoUrl
              ? `<img src="${student.photoUrl}" alt="${student.fullName}" />`
              : `<span class="photo-placeholder">👤</span>`}
          </div>
        </div>

        <!-- Details -->
        <div class="details-box">
          <div class="name-line">Name - ${student?.fullName || 'N/A'}</div>
          ${student?.fathersHusbandName ? `<div>Guardian Name - ${student.fathersHusbandName}</div>` : ''}
          ${student?.phoneNumber ? `<div>Mobile Number - ${student.phoneNumber}</div>` : ''}
          ${student?.email ? `<div>Mail - ${student.email}</div>` : ''}
          ${student?.bloodGroup ? `<div>Blood Group - ${student.bloodGroup}</div>` : ''}
          ${student?.dateOfBirth ? `<div>D.O.B - ${formatDate(student.dateOfBirth)}</div>` : ''}
          ${student?.category ? `<div>Category - ${student.category}</div>` : ''}
          ${student?.address ? `<div style="margin-top: 2px; padding: 0 10px; word-break: break-word;">Address - ${student.address}</div>` : ''}
          <div class="date-line">Date Of Issue - ${formatDateSlash(student?.letterIssuedAt) || formatDateSlash(new Date())}</div>
        </div>
      </div>
    ` : `
      <div class="error-card">
        <div class="error-icon">✕</div>
        <h2 class="error-title">Certificate Record Not Found</h2>
        <p class="error-desc">${message || `No official IHREO certificate matches the query: ${query}`}</p>
      </div>
    `}
  </div>
</body>
</html>`;
};

// GET /api/verify or GET /verify (PUBLIC - NO AUTH REQUIRED)
const verifyHandler = async (req, res) => {
  try {
    const rawParam = req.query.cert || req.query.certificateNumber || req.query.id || req.params.certificateNumber || req.params[0] || '';
    const certificateNumber = decodeURIComponent(rawParam).trim();

    const isBrowserRequest = req.accepts(['html', 'json']) === 'html' && !req.xhr && !req.headers['x-requested-with'];

    if (!certificateNumber) {
      if (isBrowserRequest) {
        return res.send(renderHtmlVerification({ valid: false, message: 'Please provide a certificate number in the URL (e.g. ?cert=IHREO/CERT/2026/0002)', query: '' }));
      }
      return res.status(400).json({ valid: false, status: 'BadRequest', message: 'Certificate number parameter is required.' });
    }

    // Prepare search variants to match IHREO, WCAEO, and refno interchangeably
    const cleanNum = certificateNumber.replace(/[\/\\]/g, '/');
    const variants = [
      cleanNum,
      cleanNum.replace(/^WCAEO/i, 'IHREO'),
      cleanNum.replace(/^IHREO/i, 'WCAEO'),
      cleanNum.replace('/CERT/', '/'),
      cleanNum.replace(/^IHREO\//i, 'IHREO/CERT/'),
      cleanNum.replace(/^WCAEO\//i, 'WCAEO/CERT/')
    ];

    let student = null;
    try {
      student = await Student.findOne({
        $or: [
          { certificateNumber: { $in: variants } },
          { refno: { $in: variants } }
        ]
      })
        .populate('eventId', 'name')
        .populate('subjectId', 'name');

      if (!student) {
        const escaped = cleanNum.replace(/[\/\\-]/g, '[\\/\\-]');
        student = await Student.findOne({
          $or: [
            { certificateNumber: { $regex: escaped, $options: 'i' } },
            { refno: { $regex: escaped, $options: 'i' } }
          ]
        })
          .populate('eventId', 'name')
          .populate('subjectId', 'name');
      }
    } catch (dbErr) {
      console.warn('Database verify lookup warning:', dbErr.message);
    }

    if (!student && global._mockStudentsStore) {
      student = global._mockStudentsStore.find((s) => {
        const sCert = (s.certificateNumber || '').toLowerCase();
        const sRef = (s.refno || '').toLowerCase();
        const target = cleanNum.toLowerCase();
        return (
          sCert === target ||
          sRef === target ||
          sCert.includes(target) ||
          sRef.includes(target) ||
          target.includes(sCert) ||
          target.includes(sRef)
        );
      });
    }

    if (!student) {
      if (isBrowserRequest) {
        return res.status(404).send(renderHtmlVerification({
          valid: false,
          status: 'NotFound',
          message: `No official IHREO certificate record found for: ${certificateNumber}`,
          query: certificateNumber
        }));
      }
      return res.status(404).json({
        valid: false,
        status: 'NotFound',
        message: `No official IHREO certificate record found for: ${certificateNumber}`
      });
    }

    const displayRefno = String(student.refno || '').replace(/^WCAEO/i, 'IHREO');
    const displayCertNo = String(student.certificateNumber || '').replace(/^WCAEO/i, 'IHREO');

    const studentPayload = {
      fullName: student.fullName,
      fathersHusbandName: student.fathersHusbandName,
      refno: displayRefno,
      certificateNumber: displayCertNo,
      category: student.category,
      letterIssuedAt: student.letterIssuedAt,
      photoUrl: student.photoUrl,
      phoneNumber: student.phoneNumber,
      email: student.email,
      bloodGroup: student.bloodGroup,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      eventName: typeof student.eventId === 'object' ? student.eventId?.name : 'IHREO Honors Convocation',
      subjectName: typeof student.subjectId === 'object' ? student.subjectId?.name : 'Academic & Educational Honors',
      certificateTemplateIds: student.certificateTemplateIds,
      status: student.status
    };

    if (student.status === 'Inactive') {
      if (isBrowserRequest) {
        return res.send(renderHtmlVerification({
          valid: false,
          status: 'Inactive',
          message: 'This certificate has been revoked or set to inactive state.',
          student: studentPayload,
          query: certificateNumber
        }));
      }
      return res.json({
        valid: false,
        status: 'Inactive',
        message: 'This certificate has been revoked or set to inactive state.',
        student: studentPayload
      });
    }

    if (isBrowserRequest) {
      return res.send(renderHtmlVerification({
        valid: true,
        status: 'Active',
        student: studentPayload,
        query: certificateNumber
      }));
    }

    return res.json({
      valid: true,
      status: 'Active',
      message: 'Official IHREO Certificate Verified',
      student: studentPayload
    });
  } catch (err) {
    console.error('Verification query error:', err);
    return res.status(500).json({ valid: false, status: 'ServerError', message: 'Error processing verification request.' });
  }
};

router.get('/', verifyHandler);
router.get('/:certificateNumber', verifyHandler);
router.get('/*', verifyHandler);

export default router;
