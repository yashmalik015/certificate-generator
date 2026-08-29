import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Helper to render standalone mobile-responsive HTML for browser visitors
const renderHtmlVerification = ({ valid, status, student, message, query }) => {
  // Format date of birth
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Extract registration number from refno (e.g. "459383/IHREO0214" → "459383")
  const regNo = student?.refno ? String(student.refno).split('/')[0] : '';
  const slNo = student?.refno || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Certificate Verification | IHREO</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f0f0;
      color: #1a1a1a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 12px;
    }

    .document-card {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border: 2px solid #222;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      position: relative;
      overflow: hidden;
    }

    /* --- Top registration bar --- */
    .reg-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #ddd;
    }

    /* --- Organization header --- */
    .org-header {
      text-align: center;
      padding: 16px 16px 10px;
      border-bottom: 1px solid #ddd;
    }
    .org-name {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 20px;
      font-weight: 900;
      color: #111;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .org-approved {
      font-size: 10px;
      color: #666;
      font-style: italic;
      margin-bottom: 8px;
    }
    .award-title {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 18px;
      font-weight: 700;
      color: #111;
      margin-top: 4px;
    }

    /* --- Photo section with watermark --- */
    .photo-section {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      min-height: 200px;
    }
    .watermark-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 220px;
      height: 220px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }
    .photo-frame {
      position: relative;
      z-index: 1;
      width: 150px;
      height: 180px;
      border: 2px solid #333;
      overflow: hidden;
      background: #f5f5f5;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: #ccc;
      background: #f5f5f5;
    }

    /* --- Details section --- */
    .details-section {
      position: relative;
      padding: 6px 20px 16px;
    }
    .details-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 280px;
      height: 280px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }
    .detail-row {
      position: relative;
      z-index: 1;
      font-size: 13.5px;
      line-height: 1.7;
      color: #222;
      text-align: center;
    }
    .detail-row strong {
      font-weight: 700;
    }

    /* --- Date of issue --- */
    .date-section {
      text-align: center;
      padding: 12px 16px 16px;
      font-size: 14px;
      font-weight: 700;
      color: #111;
    }
    .date-label {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    /* --- Verified badge bar --- */
    .verified-bar {
      background: #0d6e3f;
      color: #fff;
      text-align: center;
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .verified-bar .checkmark {
      display: inline-block;
      background: #fff;
      color: #0d6e3f;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 12px;
      line-height: 18px;
      text-align: center;
      margin-right: 6px;
      vertical-align: middle;
    }

    /* --- Error state --- */
    .error-card {
      padding: 48px 24px;
      text-align: center;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #fee2e2;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .error-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
    }
    .error-desc {
      color: #666;
      font-size: 13px;
      max-width: 360px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* --- Footer --- */
    .footer-bar {
      background: #f7f7f7;
      border-top: 1px solid #ddd;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #888;
    }

    /* --- Status pill for inactive --- */
    .inactive-pill {
      display: inline-block;
      background: #dc2626;
      color: #fff;
      padding: 4px 14px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }

    @media (max-width: 500px) {
      .document-card { border-width: 1px; }
      .org-name { font-size: 17px; }
      .award-title { font-size: 15px; }
      .photo-frame { width: 130px; height: 155px; }
      .detail-row { font-size: 12.5px; }
    }
  </style>
</head>
<body>
  <div class="document-card">
    ${valid ? `
      <!-- Verified banner -->
      <div class="verified-bar">
        <span class="checkmark">✓</span> Official Certificate — Verified
      </div>

      <!-- Registration numbers -->
      <div class="reg-bar">
        <span>Reg No. ${regNo}</span>
        <span>Sl. No. ${slNo}</span>
      </div>

      <!-- Organization header -->
      <div class="org-header">
        <div class="org-name">Iconic Human Rights<br>& Educational Organisation</div>
        <div class="org-approved">Approved by Ministry of Corporate Affairs, Government of India</div>
        <div class="award-title">${student?.category || 'Honorary Award'}</div>
      </div>

      <!-- Photo with watermark -->
      <div class="photo-section">
        <!-- IHREO circular seal watermark SVG -->
        <svg class="watermark-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="95" fill="none" stroke="#222" stroke-width="4"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#222" stroke-width="2"/>
          <path id="topArc" d="M 30,100 A 70,70 0 0,1 170,100" fill="none"/>
          <text font-size="11" font-weight="700" fill="#222" letter-spacing="3">
            <textPath href="#topArc" startOffset="50%" text-anchor="middle">ICONIC HUMAN RIGHTS</textPath>
          </text>
          <path id="bottomArc" d="M 170,100 A 70,70 0 0,1 30,100" fill="none"/>
          <text font-size="11" font-weight="700" fill="#222" letter-spacing="3">
            <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">& EDUCATIONAL ORGANISATION</textPath>
          </text>
          <!-- Center: graduation cap icon simplified -->
          <text x="100" y="95" text-anchor="middle" font-size="36" fill="#222">🎓</text>
          <text x="100" y="118" text-anchor="middle" font-size="16" font-weight="800" fill="#222">IHREO</text>
          <!-- Laurel branches (simplified) -->
          <path d="M20,130 Q30,100 25,70 Q35,95 30,120 Q25,125 20,130Z" fill="#2d7a3a" opacity="0.6"/>
          <path d="M15,140 Q28,108 22,78 Q32,102 28,128 Q22,135 15,140Z" fill="#2d7a3a" opacity="0.4"/>
          <path d="M180,130 Q170,100 175,70 Q165,95 170,120 Q175,125 180,130Z" fill="#2d7a3a" opacity="0.6"/>
          <path d="M185,140 Q172,108 178,78 Q168,102 172,128 Q178,135 185,140Z" fill="#2d7a3a" opacity="0.4"/>
          <!-- Stars -->
          <text x="80" y="68" text-anchor="middle" font-size="10" fill="#d97706">★</text>
          <text x="100" y="62" text-anchor="middle" font-size="12" fill="#d97706">★</text>
          <text x="120" y="68" text-anchor="middle" font-size="10" fill="#d97706">★</text>
        </svg>

        ${student?.photoUrl 
          ? `<div class="photo-frame"><img src="${student.photoUrl}" alt="${student.fullName}" /></div>` 
          : `<div class="photo-frame"><div class="photo-placeholder">👤</div></div>`}
      </div>

      <!-- Details -->
      <div class="details-section">
        <!-- Watermark behind details too -->
        <svg class="details-watermark" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="95" fill="none" stroke="#222" stroke-width="4"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#222" stroke-width="2"/>
          <path id="topArc2" d="M 30,100 A 70,70 0 0,1 170,100" fill="none"/>
          <text font-size="11" font-weight="700" fill="#222" letter-spacing="3">
            <textPath href="#topArc2" startOffset="50%" text-anchor="middle">ICONIC HUMAN RIGHTS</textPath>
          </text>
          <path id="bottomArc2" d="M 170,100 A 70,70 0 0,1 30,100" fill="none"/>
          <text font-size="11" font-weight="700" fill="#222" letter-spacing="3">
            <textPath href="#bottomArc2" startOffset="50%" text-anchor="middle">& EDUCATIONAL ORGANISATION</textPath>
          </text>
          <text x="100" y="95" text-anchor="middle" font-size="36" fill="#222">🎓</text>
          <text x="100" y="118" text-anchor="middle" font-size="16" font-weight="800" fill="#222">IHREO</text>
          <path d="M20,130 Q30,100 25,70 Q35,95 30,120 Q25,125 20,130Z" fill="#2d7a3a" opacity="0.6"/>
          <path d="M15,140 Q28,108 22,78 Q32,102 28,128 Q22,135 15,140Z" fill="#2d7a3a" opacity="0.4"/>
          <path d="M180,130 Q170,100 175,70 Q165,95 170,120 Q175,125 180,130Z" fill="#2d7a3a" opacity="0.6"/>
          <path d="M185,140 Q172,108 178,78 Q168,102 172,128 Q178,135 185,140Z" fill="#2d7a3a" opacity="0.4"/>
          <text x="80" y="68" text-anchor="middle" font-size="10" fill="#d97706">★</text>
          <text x="100" y="62" text-anchor="middle" font-size="12" fill="#d97706">★</text>
          <text x="120" y="68" text-anchor="middle" font-size="10" fill="#d97706">★</text>
        </svg>

        <div class="detail-row"><strong>Name:</strong> ${student?.fullName || 'N/A'}</div>
        ${student?.fathersHusbandName ? `<div class="detail-row"><strong>Father's Name:</strong> ${student.fathersHusbandName}</div>` : ''}
        ${student?.phoneNumber ? `<div class="detail-row"><strong>Mobile Number:</strong> ${student.phoneNumber}</div>` : ''}
        ${student?.email ? `<div class="detail-row"><strong>E-mail Id:</strong> ${student.email}</div>` : ''}
        ${student?.bloodGroup ? `<div class="detail-row"><strong>Blood Group -</strong> ${student.bloodGroup}</div>` : ''}
        ${student?.dateOfBirth ? `<div class="detail-row"><strong>D.O.B.:</strong> ${formatDate(student.dateOfBirth)}</div>` : ''}
        <div class="detail-row"><strong>Category:</strong> ${student?.category || 'N/A'}</div>
        ${student?.address ? `<div class="detail-row"><strong>Full Address:</strong> ${student.address}</div>` : ''}
        ${student?.eventName ? `<div class="detail-row"><strong>Event:</strong> ${student.eventName}</div>` : ''}
        ${student?.subjectName ? `<div class="detail-row"><strong>Subject:</strong> ${student.subjectName}</div>` : ''}
      </div>

      <!-- Date of issue -->
      <div class="date-section">
        <div class="date-label">Date of Issue</div>
        <div>${student?.letterIssuedAt ? formatDate(student.letterIssuedAt) : 'N/A'}</div>
      </div>
    ` : `
      <div class="error-card">
        <div class="error-icon">✕</div>
        <h2 class="error-title">Certificate Not Found</h2>
        <p class="error-desc">${message || `No official IHREO certificate matches the query: ${query}`}</p>
      </div>
    `}

    <div class="footer-bar">
      <div>IHREO — Official Registry</div>
      <div>Authenticated Record</div>
    </div>
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
