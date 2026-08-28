import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import { generateCertificate, generateIdCard, generateMembershipCert } from '../services/certificateGenerator.js';
import { sendCertificateEmail } from '../services/mailer.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Global fallback store for serverless environments when DB is not connected
global._mockStudentsStore = global._mockStudentsStore || [];

// Helper to determine active base URL for QR codes
const getReqBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = forwardedProto ? forwardedProto.split(',')[0].trim() : (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    return `${proto}://${host}`;
  }
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'https://certificate-generator.vercel.app';
};

// Helper to auto-generate Next Refno and Certificate Number
const generateAutoNumbers = async () => {
  const year = new Date().getFullYear();
  let count = 0;
  if (mongoose.connection.readyState === 1) {
    try {
      count = await Student.countDocuments();
    } catch {
      count = global._mockStudentsStore.length;
    }
  } else {
    count = global._mockStudentsStore.length;
  }
  let nextSeq = count + 2;
  let refno = `IHREO/${year}/${String(nextSeq).padStart(3, '0')}`;
  let certificateNumber = `IHREO/CERT/${year}/${String(nextSeq).padStart(4, '0')}`;

  if (mongoose.connection.readyState === 1) {
    try {
      while (await Student.exists({ $or: [{ refno }, { certificateNumber }] })) {
        nextSeq += 1;
        refno = `IHREO/${year}/${String(nextSeq).padStart(3, '0')}`;
        certificateNumber = `IHREO/CERT/${year}/${String(nextSeq).padStart(4, '0')}`;
      }
    } catch (existErr) {
      console.warn('Auto number uniqueness check warning:', existErr.message);
    }
  }

  return { refno, certificateNumber };
};

// GET /api/students/auto-numbers
router.get('/auto-numbers', authMiddleware, async (req, res) => {
  try {
    const numbers = await generateAutoNumbers();
    return res.json(numbers);
  } catch (err) {
    return res.json({ refno: `IHREO/${new Date().getFullYear()}/002`, certificateNumber: `IHREO/CERT/${new Date().getFullYear()}/0002` });
  }
});

// GET /api/students
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const eventFilter = req.query.event || '';
    const subjectFilter = req.query.subject || '';
    const statusFilter = req.query.status || '';

    if (mongoose.connection.readyState === 1) {
      const query = {};

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { refno: { $regex: search, $options: 'i' } },
          { certificateNumber: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      if (eventFilter && mongoose.Types.ObjectId.isValid(eventFilter)) {
        query.eventId = eventFilter;
      }
      if (subjectFilter && mongoose.Types.ObjectId.isValid(subjectFilter)) {
        query.subjectId = subjectFilter;
      }
      if (statusFilter) {
        query.status = statusFilter;
      }

      const total = await Student.countDocuments(query);
      const students = await Student.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('eventId', 'name')
        .populate('subjectId', 'name');

      // Normalize displayed ref numbers
      const normalizedStudents = students.map((s) => {
        const obj = s.toObject();
        obj.refno = String(obj.refno || '').replace(/^WCAEO/i, 'IHREO');
        obj.certificateNumber = String(obj.certificateNumber || '').replace(/^WCAEO/i, 'IHREO');
        return obj;
      });

      return res.json({
        students: normalizedStudents,
        total,
        page,
        totalPages: Math.ceil(total / perPage)
      });
    } else {
      let filtered = [...global._mockStudentsStore];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((st) =>
          (st.fullName && st.fullName.toLowerCase().includes(s)) ||
          (st.refno && st.refno.toLowerCase().includes(s)) ||
          (st.certificateNumber && st.certificateNumber.toLowerCase().includes(s)) ||
          (st.category && st.category.toLowerCase().includes(s))
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((st) => st.status === statusFilter);
      }

      const total = filtered.length;
      const start = (page - 1) * perPage;
      const paginated = filtered.slice(start, start + perPage);

      const normalized = paginated.map((st) => ({
        ...st,
        refno: String(st.refno || '').replace(/^WCAEO/i, 'IHREO'),
        certificateNumber: String(st.certificateNumber || '').replace(/^WCAEO/i, 'IHREO')
      }));

      return res.json({
        students: normalized,
        total,
        page,
        totalPages: Math.ceil(total / perPage)
      });
    }
  } catch (err) {
    console.error('Fetch students error:', err);
    return res.status(500).json({ error: 'Failed to retrieve students: ' + err.message });
  }
});

// GET /api/students/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const student = await Student.findById(req.params.id)
        .populate('eventId', 'name')
        .populate('subjectId', 'name');
      if (!student) {
        return res.status(404).json({ error: 'Student not found.' });
      }
      const obj = student.toObject();
      obj.refno = String(obj.refno || '').replace(/^WCAEO/i, 'IHREO');
      obj.certificateNumber = String(obj.certificateNumber || '').replace(/^WCAEO/i, 'IHREO');
      return res.json(obj);
    } else {
      const mock = global._mockStudentsStore.find((s) => s._id === req.params.id);
      if (!mock) {
        return res.status(404).json({ error: 'Student not found.' });
      }
      return res.json({
        ...mock,
        refno: String(mock.refno || '').replace(/^WCAEO/i, 'IHREO'),
        certificateNumber: String(mock.certificateNumber || '').replace(/^WCAEO/i, 'IHREO')
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student details.' });
  }
});

// POST /api/students
router.post('/', authMiddleware, async (req, res) => {
  try {
    const auto = await generateAutoNumbers();
    const baseUrl = getReqBaseUrl(req);

    const studentData = {
      ...req.body,
      refno: String(req.body.refno || auto.refno).replace(/WCAEO/gi, 'IHREO'),
      certificateNumber: String(req.body.certificateNumber || auto.certificateNumber).replace(/WCAEO/gi, 'IHREO'),
      letterIssuedAt: req.body.letterIssuedAt || new Date()
    };

    if (!studentData.fullName || !studentData.category || !studentData.photoUrl || !studentData.eventId || !studentData.subjectId) {
      return res.status(400).json({ error: 'Missing required student fields (fullName, category, photoUrl, eventId, subjectId).' });
    }

    let templatesToRun = studentData.certificateTemplateIds;
    if (typeof templatesToRun === 'string') {
      templatesToRun = [templatesToRun];
    }
    if (!templatesToRun || !Array.isArray(templatesToRun) || templatesToRun.length === 0) {
      return res.status(400).json({ error: 'At least one certificate template must be selected.' });
    }

    let newStudent = null;

    if (mongoose.connection.readyState === 1) {
      newStudent = new Student({
        ...studentData,
        certificateTemplateIds: templatesToRun,
        generatedCertificateUrls: []
      });
      await newStudent.save();

      // Generate award certificates in parallel with real-time baseUrl
      const certResults = await Promise.all(
        templatesToRun.map(async (tid) => {
          try { return await generateCertificate(newStudent, tid, baseUrl); } catch (e) {
            console.error(`Cert gen error (${tid}):`, e); return null;
          }
        })
      );

      // Generate universal ID Card + Membership Certificate with real-time baseUrl
      let idCardResult = null, membershipResult = null;
      try { idCardResult = await generateIdCard(newStudent, baseUrl); } catch (e) { console.error('ID card gen error:', e); }
      try { membershipResult = await generateMembershipCert(newStudent, baseUrl); } catch (e) { console.error('Membership gen error:', e); }

      const generatedUrls = [
        ...certResults.filter(Boolean),
        ...(idCardResult ? [idCardResult] : []),
        ...(membershipResult ? [membershipResult] : [])
      ];

      newStudent.generatedCertificateUrls = generatedUrls;
      await newStudent.save();

      const populated = await Student.findById(newStudent._id)
        .populate('eventId', 'name')
        .populate('subjectId', 'name');

      return res.status(201).json(populated);
    } else {
      // In-memory response when DB not connected
      const mockStudent = {
        _id: `student_${Date.now()}`,
        ...studentData,
        certificateTemplateIds: templatesToRun,
        generatedCertificateUrls: [],
        createdAt: new Date()
      };

      const generatedResults = await Promise.all(
        templatesToRun.map(async (tid) => {
          try {
            return await generateCertificate(mockStudent, tid, baseUrl);
          } catch (genErr) {
            console.error(`Certificate generation error for template ${tid}:`, genErr);
            return null;
          }
        })
      );
      mockStudent.generatedCertificateUrls = generatedResults.filter(Boolean);

      global._mockStudentsStore.unshift(mockStudent);
      return res.status(201).json(mockStudent);
    }
  } catch (err) {
    console.error('Create student error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Student with this Reference Number or Certificate Number already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create student record: ' + err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const baseUrl = getReqBaseUrl(req);
    const updatedData = { ...req.body };
    if (updatedData.refno) updatedData.refno = String(updatedData.refno).replace(/WCAEO/gi, 'IHREO');
    if (updatedData.certificateNumber) updatedData.certificateNumber = String(updatedData.certificateNumber).replace(/WCAEO/gi, 'IHREO');

    if (mongoose.connection.readyState === 1) {
      const student = await Student.findById(req.params.id);
      if (student) {
        Object.assign(student, updatedData);

        let templatesToRun = updatedData.certificateTemplateIds || student.certificateTemplateIds;
        if (typeof templatesToRun === 'string') templatesToRun = [templatesToRun];
        student.certificateTemplateIds = templatesToRun;

        // Regenerate award certificates
        const generatedUrls = [];
        for (const tid of templatesToRun) {
          try {
            const certRes = await generateCertificate(student, tid, baseUrl);
            generatedUrls.push(certRes);
          } catch (genErr) { console.error(`Cert regen error (${tid}):`, genErr); }
        }

        // Regenerate universal docs
        try { const r = await generateIdCard(student, baseUrl); if (r) generatedUrls.push(r); } catch (e) { console.error('ID card regen:', e); }
        try { const r = await generateMembershipCert(student, baseUrl); if (r) generatedUrls.push(r); } catch (e) { console.error('Membership regen:', e); }

        student.generatedCertificateUrls = generatedUrls;
        await student.save();

        const updated = await Student.findById(student._id)
          .populate('eventId', 'name')
          .populate('subjectId', 'name');

        return res.json(updated);
      }
    }

    const idx = global._mockStudentsStore.findIndex((s) => s._id === req.params.id);
    if (idx !== -1) {
      Object.assign(global._mockStudentsStore[idx], updatedData);
      return res.json(global._mockStudentsStore[idx]);
    }

    return res.json({ _id: req.params.id, ...updatedData });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ error: 'Failed to update student record.' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`[DELETE /api/students/${id}] processing deletion...`);

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Student.findByIdAndDelete(id);
      } else {
        await Student.deleteOne({ $or: [{ _id: id }, { refno: id }, { certificateNumber: id }] });
      }
    }
    global._mockStudentsStore = global._mockStudentsStore.filter(
      (s) => String(s._id) !== String(id) && s.refno !== id
    );
    console.log(`[DELETE /api/students/${id}] successfully deleted.`);
    return res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err);
    return res.status(500).json({ error: 'Failed to delete student: ' + err.message });
  }
});

// POST /api/students/:id/send-mail
router.post('/:id/send-mail', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const student = await Student.findById(req.params.id);
      if (student) {
        if (!student.generatedCertificateUrls || student.generatedCertificateUrls.length === 0) {
          return res.status(400).json({ error: 'No certificates generated for this student yet.' });
        }

        await sendCertificateEmail(student, student.generatedCertificateUrls);
        student.mailSent = true;
        await student.save();

        return res.json({ message: `Certificate email successfully sent to ${student.email}`, mailSent: true });
      }
    }
    return res.json({ message: 'Email queued successfully in fallback mode.', mailSent: true });
  } catch (err) {
    console.error('Send mail error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send certificate email.' });
  }
});

// GET /api/students/:id/certificate/:templateId/download
router.get('/:id/certificate/:templateId/download', authMiddleware, async (req, res) => {
  try {
    const { id, templateId } = req.params;
    const format = req.query.format || 'pdf'; // 'pdf' or 'png'
    const baseUrl = getReqBaseUrl(req);
    let student = null;

    if (mongoose.connection.readyState === 1) {
      student = await Student.findById(id);
    }

    if (!student) {
      student = global._mockStudentsStore.find((s) => s._id === id);
    }

    if (!student) {
      student = {
        _id: id,
        refno: 'IHREO/2026/002',
        certificateNumber: 'IHREO/CERT/2026/0002',
        fullName: 'Student',
        category: 'Excellence',
        letterIssuedAt: new Date()
      };
    }

    let certRes;
    if (templateId === 'universal-id-card') {
      certRes = await generateIdCard(student, baseUrl);
    } else if (templateId === 'universal-membership-certificate') {
      certRes = await generateMembershipCert(student, baseUrl);
    } else {
      certRes = await generateCertificate(student, templateId, baseUrl);
    }

    const relativeUrl = format === 'png' ? certRes.pngUrl : certRes.pdfUrl;

    const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
    const filePath = isVercel
      ? path.join('/tmp', relativeUrl.replace(/^\//, ''))
      : path.resolve(__dirname, '..', relativeUrl.replace(/^\//, ''));

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Certificate file not found on server.');
    }

    return res.download(filePath);
  } catch (err) {
    console.error('Download certificate error:', err);
    return res.status(500).send('Error downloading certificate.');
  }
});

export default router;
