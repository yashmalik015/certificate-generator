import express from 'express';
import Event from '../models/Event.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find().sort({ name: 1 });
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Event name is required.' });
    const event = await Event.create({ name: name.trim(), description });
    return res.status(201).json(event);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Event with this name already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create event.' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update event.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete event.' });
  }
});

export default router;
