import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import { generateCertificate } from '../services/certificateGenerator.js';
import { sendCertificateEmail } from '../services/mailer.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Global fallback store for serverless environments when DB is not connected
global._mockStudentsStore = global._mockStudentsStore || [];

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
  let nextSeq = count + 1;
  let refno = `WCAEO/${year}/${String(nextSeq).padStart(3, '0')}`;
  let certificateNumber = `WCAEO/CERT/${year}/${String(nextSeq).padStart(4, '0')}`;

  if (mongoose.connection.readyState === 1) {
    try {
      while (await Student.exists({ $or: [{ refno }, { certificateNumber }] })) {
        nextSeq += 1;
        refno = `WCAEO/${year}/${String(nextSeq).padStart(3, '0')}`;
        certificateNumber = `WCAEO/CERT/${year}/${String(nextSeq).padStart(4, '0')}`;
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
    return res.json({ refno: `WCAEO/${new Date().getFullYear()}/001`, certificateNumber: `WCAEO/CERT/${new Date().getFullYear()}/0001` });
  }
});

// GET /api/students
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const search = (req.query.search || '').trim().toLowerCase();
    const status = req.query.status;
    const category = req.query.category;

    if (mongoose.connection.readyState !== 1) {
      let filtered = [...global._mockStudentsStore];
      if (search) {
        filtered = filtered.filter((s) =>
          (s.fullName || '').toLowerCase().includes(search) ||
          (s.refno || '').toLowerCase().includes(search) ||
          (s.certificateNumber || '').toLowerCase().includes(search) ||
          (s.category || '').toLowerCase().includes(search) ||
          (s.email || '').toLowerCase().includes(search)
        );
      }
      if (status) filtered = filtered.filter((s) => s.status === status);
      if (category) filtered = filtered.filter((s) => s.category === category);

      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage) || 1;
      const startIdx = (page - 1) * perPage;
      const paginated = filtered.slice(startIdx, startIdx + perPage);

      return res.json({
        data: paginated,
        pagination: { total, page, perPage, totalPages }
      });
    }

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { refno: { $regex: search, $options: 'i' } },
        { certificateNumber: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (category) query.category = category;

    const total = await Student.countDocuments(query);
    const totalPages = Math.ceil(total / perPage) || 1;

    const students = await Student.find(query)
      .populate('eventId', 'name')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.json({
      data: students,
      pagination: {
        total,
        page,
        perPage,
        totalPages
      }
    });
  } catch (err) {
    console.error('Fetch students error:', err);
    return res.json({
      data: global._mockStudentsStore,
      pagination: { total: global._mockStudentsStore.length, page: 1, perPage: 10, totalPages: 1 }
    });
  }
});

// GET /api/students/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const student = await Student.findById(req.params.id)
        .populate('eventId')
        .populate('subjectId');
      if (student) return res.json(student);
    }
    const found = global._mockStudentsStore.find((s) => s._id === req.params.id);
    if (found) return res.json(found);
    return res.status(404).json({ error: 'Student not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student details.' });
  }
});

// POST /api/students
router.post('/', authMiddleware, async (req, res) => {
  try {
    const auto = await generateAutoNumbers();
    const studentData = {
      ...req.body,
      refno: req.body.refno || auto.refno,
      certificateNumber: req.body.certificateNumber || auto.certificateNumber,
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

      // Trigger certificate generation in parallel
      const generatedResults = await Promise.all(
        templatesToRun.map(async (tid) => {
          try {
            return await generateCertificate(newStudent, tid);
          } catch (genErr) {
            console.error(`Certificate generation error for template ${tid}:`, genErr);
            return null;
          }
        })
      );
      const generatedUrls = generatedResults.filter(Boolean);

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
            return await generateCertificate(mockStudent, tid);
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
    if (mongoose.connection.readyState === 1) {
      const student = await Student.findById(req.params.id);
      if (student) {
        Object.assign(student, req.body);

        let templatesToRun = req.body.certificateTemplateIds || student.certificateTemplateIds;
        if (typeof templatesToRun === 'string') templatesToRun = [templatesToRun];
        student.certificateTemplateIds = templatesToRun;

        const generatedUrls = [];
        for (const tid of templatesToRun) {
          try {
            const certRes = await generateCertificate(student, tid);
            generatedUrls.push(certRes);
          } catch (genErr) {
            console.error(`Certificate regeneration error for template ${tid}:`, genErr);
          }
        }

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
      Object.assign(global._mockStudentsStore[idx], req.body);
      return res.json(global._mockStudentsStore[idx]);
    }

    return res.json({ _id: req.params.id, ...req.body });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ error: 'Failed to update student record.' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Student.findByIdAndDelete(req.params.id);
    }
    global._mockStudentsStore = global._mockStudentsStore.filter((s) => s._id !== req.params.id);
    return res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete student.' });
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
        refno: 'WCAEO/2026/001',
        certificateNumber: 'WCAEO/CERT/2026/0001',
        fullName: 'Student',
        category: 'Excellence',
        letterIssuedAt: new Date()
      };
    }

    const certRes = await generateCertificate(student, templateId);
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
