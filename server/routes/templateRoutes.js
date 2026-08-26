import express from 'express';
import { getAvailableTemplates } from '../services/certificateGenerator.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const templates = getAvailableTemplates();
    return res.json(templates);
  } catch (err) {
    console.error('Fetch templates error:', err);
    return res.status(500).json({ error: 'Failed to scan certificate templates.' });
  }
});

export default router;
