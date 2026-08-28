import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Helper to render standalone mobile-responsive HTML for browser visitors
const renderHtmlVerification = ({ valid, status, student, message, query }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Certificate Verification | IHREO</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
    }
    .header { text-align: center; margin-bottom: 28px; max-width: 680px; }
    .logo-badge {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #f59e0b, #b45309);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 28px;
      margin-bottom: 12px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
    }
    .title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; margin-bottom: 6px; }
    .subtitle { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .card {
      width: 100%; max-width: 620px;
      background: #131b2e;
      border: 1px solid #23304c;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .banner-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.3));
      border-bottom: 1px solid rgba(16, 185, 129, 0.3);
      padding: 22px 20px;
      text-align: center;
    }
    .status-pill {
      display: inline-block;
      background: #10b981;
      color: #000000;
      padding: 6px 18px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 8px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .banner-title { font-size: 17px; font-weight: 700; color: #ffffff; }
    .banner-desc { font-size: 12.5px; color: #cbd5e1; margin-top: 4px; }
    .content { padding: 28px 24px; }
    .profile-row {
      display: flex; gap: 18px; align-items: center;
      margin-bottom: 24px; padding-bottom: 20px;
      border-bottom: 1px solid #23304c;
    }
    .profile-photo {
      width: 85px; height: 85px;
      border-radius: 12px;
      object-fit: cover;
      border: 3px solid #f59e0b;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .profile-placeholder {
      width: 85px; height: 85px;
      border-radius: 12px;
      background: #1a233a;
      border: 2px solid #334155;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: #94a3b8;
    }
    .profile-name { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
    .badge-active {
      display: inline-block;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 6px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13.5px; }
    .grid-col-2 { grid-column: span 2; }
    .label { color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
    .value { font-weight: 600; color: #ffffff; word-break: break-all; }
    .value-highlight { color: #f59e0b; font-weight: 700; }
    .footer-bar {
      background: #0b0f19;
      padding: 14px 20px;
      border-top: 1px solid #23304c;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      color: #64748b;
    }
    .error-card { padding: 44px 24px; text-align: center; }
    .error-icon { font-size: 48px; color: #ef4444; margin-bottom: 12px; }
    .error-title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    .error-desc { color: #94a3b8; font-size: 13.5px; max-width: 420px; margin: 0 auto; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-badge">🏛️</div>
    <h1 class="title">ICONIC HUMAN RIGHTS & EDUCATIONAL ORGANISATION</h1>
    <p class="subtitle">Approved by Ministry of Corporate Affairs, Government of India | Official Registry (IHREO)</p>
  </div>

  <div class="card">
    ${valid ? `
      <div class="banner-success">
        <div class="status-pill">✓ OFFICIAL CERTIFICATE VERIFIED</div>
        <h2 class="banner-title">Authentic IHREO Honor & Award Record</h2>
        <p class="banner-desc">This record has been officially authenticated and confirmed in the IHREO central register.</p>
      </div>

      <div class="content">
        <div class="profile-row">
          ${student?.photoUrl ? `<img src="${student.photoUrl}" alt="${student.fullName}" class="profile-photo" />` : `<div class="profile-placeholder">👤</div>`}
          <div>
            <h3 class="profile-name">${student?.fullName}</h3>
            ${student?.fathersHusbandName ? `<p style="font-size: 12.5px; color: #94a3b8;">S/D/W of: ${student.fathersHusbandName}</p>` : ''}
            <div class="badge-active">🛡️ Active Certificate</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="label">Certificate Number</div>
            <div class="value value-highlight">${student?.certificateNumber}</div>
          </div>
          <div>
            <div class="label">Reference Number</div>
            <div class="value">${student?.refno}</div>
          </div>
          <div class="grid-col-2">
            <div class="label">Award Category</div>
            <div class="value" style="font-size: 14.5px;">${student?.category}</div>
          </div>
          <div>
            <div class="label">Event / Ceremony</div>
            <div class="value" style="color: #e2e8f0;">${student?.eventName}</div>
          </div>
          <div>
            <div class="label">Subject Discipline</div>
            <div class="value" style="color: #e2e8f0;">${student?.subjectName}</div>
          </div>
          <div>
            <div class="label">Date of Issue</div>
            <div class="value" style="color: #e2e8f0;">
              ${student?.letterIssuedAt ? new Date(student.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    ` : `
      <div class="error-card">
        <div class="error-icon">✕</div>
        <h2 class="error-title">Certificate Record Not Found</h2>
        <p class="error-desc">${message || `No official IHREO certificate matches the query: ${query}`}</p>
      </div>
    `}

    <div class="footer-bar">
      <div>🏛️ IHREO Honors Council</div>
      <div>Official Seal & Authenticated Record</div>
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
