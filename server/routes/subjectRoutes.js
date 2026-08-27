import express from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const defaultSubjects = [
  { _id: '65b000000000000000000001', name: 'Social Service & Humanitarian Work' },
  { _id: '65b000000000000000000002', name: 'Higher Education & Research' },
  { _id: '65b000000000000000000003', name: 'Literature, Poetry & Arts' },
  { _id: '65b000000000000000000004', name: 'Business Leadership & Entrepreneurship' },
  { _id: '65b000000000000000000005', name: 'Healthcare & Medical Service' }
];

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subjects = await Subject.find().sort({ name: 1 });
      return res.json(subjects);
    }
    return res.json(defaultSubjects);
  } catch (err) {
    return res.json(defaultSubjects);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required.' });

    if (mongoose.connection.readyState === 1) {
      const subject = await Subject.create({ name: name.trim() });
      return res.status(201).json(subject);
    }

    const mockSubj = { _id: `subj_${Date.now()}`, name: name.trim() };
    defaultSubjects.push(mockSubj);
    return res.status(201).json(mockSubj);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Subject with this name already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (mongoose.connection.readyState === 1) {
      const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        { name: name.trim() },
        { new: true }
      );
      if (!subject) return res.status(404).json({ error: 'Subject not found.' });
      return res.json(subject);
    }
    return res.json({ _id: req.params.id, name });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Subject.findByIdAndDelete(req.params.id);
    }
    return res.json({ message: 'Subject deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
});

export default router;
