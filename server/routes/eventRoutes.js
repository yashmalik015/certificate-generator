import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const defaultEvents = [
  { _id: 'event_001', name: 'National Excellence Awards 2026', description: 'Annual honor ceremony for national achievers' },
  { _id: 'event_002', name: 'Global Education & Leadership Summit', description: 'International academic conference & award ceremony' },
  { _id: 'event_003', name: 'Sahitya & Cultural Recognition Ceremony', description: 'Honoring literary and cultural icons' }
];

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const events = await Event.find().sort({ name: 1 });
      return res.json(events);
    }
    return res.json(defaultEvents);
  } catch (err) {
    return res.json(defaultEvents);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Event name is required.' });

    if (mongoose.connection.readyState === 1) {
      const event = await Event.create({ name: name.trim(), description });
      return res.status(201).json(event);
    }

    const mockEvent = { _id: `event_${Date.now()}`, name: name.trim(), description };
    defaultEvents.push(mockEvent);
    return res.status(201).json(mockEvent);
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
    if (mongoose.connection.readyState === 1) {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { name: name.trim(), description },
        { new: true }
      );
      if (!event) return res.status(404).json({ error: 'Event not found.' });
      return res.json(event);
    }
    return res.json({ _id: req.params.id, name, description });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update event.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Event.findByIdAndDelete(req.params.id);
    }
    return res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete event.' });
  }
});

export default router;
