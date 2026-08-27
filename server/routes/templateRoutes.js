import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAvailableTemplates } from '../services/certificateGenerator.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const templatesDir = path.resolve(__dirname, '../../src/assets/certificate-templates');
const configDir = path.join(templatesDir, 'config');

// GET /api/certificate-templates — list all available templates
router.get('/', authMiddleware, (req, res) => {
  try {
    const templates = getAvailableTemplates();
    return res.json(templates);
  } catch (err) {
    console.error('Fetch templates error:', err);
    return res.status(500).json({ error: 'Failed to scan certificate templates.' });
  }
});

// GET /api/certificate-templates/:id/config — get config JSON for a template
router.get('/:id/config', authMiddleware, (req, res) => {
  try {
    const templateId = decodeURIComponent(req.params.id);
    const configPath = path.join(configDir, `${templateId}.json`);
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return res.json({ exists: true, config });
    }
    return res.json({ exists: false, config: null });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read template config.' });
  }
});

// PUT /api/certificate-templates/:id/config — save config JSON for a template
router.put('/:id/config', authMiddleware, (req, res) => {
  try {
    const templateId = decodeURIComponent(req.params.id);
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid config payload.' });
    }
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, `${templateId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return res.json({ message: `Config saved for template: ${templateId}`, configPath });
  } catch (err) {
    console.error('Save template config error:', err);
    return res.status(500).json({ error: 'Failed to save template config: ' + err.message });
  }
});

export default router;
