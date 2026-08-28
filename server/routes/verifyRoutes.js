import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// GET /api/verify (PUBLIC - NO AUTH REQUIRED)
const verifyHandler = async (req, res) => {
  try {
    const rawParam = req.query.cert || req.query.certificateNumber || req.query.id || req.params.certificateNumber || req.params[0] || '';
    const certificateNumber = decodeURIComponent(rawParam).trim();

    if (!certificateNumber) {
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
      return res.status(404).json({
        valid: false,
        status: 'NotFound',
        message: `No official IHREO certificate record found for: ${certificateNumber}`
      });
    }

    const displayRefno = String(student.refno || '').replace(/^WCAEO/i, 'IHREO');
    const displayCertNo = String(student.certificateNumber || '').replace(/^WCAEO/i, 'IHREO');

    if (student.status === 'Inactive') {
      return res.json({
        valid: false,
        status: 'Inactive',
        message: 'This certificate has been revoked or set to inactive state.',
        student: {
          fullName: student.fullName,
          refno: displayRefno,
          certificateNumber: displayCertNo,
          category: student.category,
          letterIssuedAt: student.letterIssuedAt,
          status: student.status
        }
      });
    }

    return res.json({
      valid: true,
      status: 'Active',
      message: 'Official IHREO Certificate Verified',
      student: {
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
      }
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
