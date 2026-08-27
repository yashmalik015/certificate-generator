import express from 'express';
import Designation from '../models/Designation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET all designations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const designations = await Designation.find().sort({ name: 1 });
    return res.json(designations);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch designations.' });
  }
});

// POST create
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Designation name is required.' });
    const existing = await Designation.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ error: 'Designation already exists.' });
    const designation = await Designation.create({ name: name.trim() });
    return res.status(201).json(designation);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create designation.' });
  }
});

// PUT update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Designation name is required.' });
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    if (!designation) return res.status(404).json({ error: 'Designation not found.' });
    return res.json(designation);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update designation.' });
  }
});

// DELETE
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);
    if (!designation) return res.status(404).json({ error: 'Designation not found.' });
    return res.json({ message: 'Designation deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete designation.' });
  }
});

export default router;
