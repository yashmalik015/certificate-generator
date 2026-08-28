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

    // Try exact match or flexible regex match
    let student = null;
    try {
      student = await Student.findOne({ certificateNumber })
        .populate('eventId', 'name')
        .populate('subjectId', 'name');

      if (!student) {
        const escaped = certificateNumber.replace(/[\/\\-]/g, '[\\/\\-]');
        student = await Student.findOne({ certificateNumber: { $regex: `^${escaped}$`, $options: 'i' } })
          .populate('eventId', 'name')
          .populate('subjectId', 'name');
      }
    } catch (dbErr) {
      console.warn('Database verify lookup warning:', dbErr.message);
    }

    if (!student && global._mockStudentsStore) {
      student = global._mockStudentsStore.find(
        (s) => s.certificateNumber === certificateNumber || s.certificateNumber?.toLowerCase() === certificateNumber.toLowerCase()
      );
    }

    if (!student) {
      return res.status(404).json({
        valid: false,
        status: 'NotFound',
        message: 'No official IHREO certificate record found for this certificate number.'
      });
    }

    if (student.status === 'Inactive') {
      return res.json({
        valid: false,
        status: 'Inactive',
        message: 'This certificate has been revoked or set to inactive state.',
        student: {
          fullName: student.fullName,
          refno: student.refno,
          certificateNumber: student.certificateNumber,
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
        refno: student.refno,
        certificateNumber: student.certificateNumber,
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
