import express from 'express';
import Subject from '../models/Subject.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    return res.json(subjects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required.' });
    const subject = await Subject.create({ name: name.trim() });
    return res.status(201).json(subject);
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
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });
    return res.json(subject);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Subject deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
});

export default router;
