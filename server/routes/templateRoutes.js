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
    let configPath = path.join(configDir, `${templateId}.json`);
    if (!fs.existsSync(configPath) && fs.existsSync(configDir)) {
      const cleanTarget = String(templateId).toLowerCase().replace(/[-_\s]+/g, '');
      const files = fs.readdirSync(configDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const cleanFile = path.parse(file).name.toLowerCase().replace(/[-_\s]+/g, '');
          if (cleanFile === cleanTarget) {
            configPath = path.join(configDir, file);
            break;
          }
        }
      }
    }
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
    return res.status(500).json({ error: 'Failed to save template config.' });
  }
});

// GET /api/certificate-templates/:id/preview — stream preview image of a template
router.get('/:id/preview', (req, res) => {
  try {
    const templateId = decodeURIComponent(req.params.id);
    const searchDirs = [
      path.resolve(__dirname, '../../public/assets/certificate-templates'),
      path.resolve(__dirname, '../../src/assets/certificate-templates'),
      path.resolve(__dirname, '../../src/assets'),
      path.join(process.cwd(), 'public/assets/certificate-templates'),
      path.join(process.cwd(), 'src/assets/certificate-templates'),
      path.join(process.cwd(), 'src/assets')
    ];

    let foundPath = null;
    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const direct = path.join(dir, `${templateId}.png`);
      if (fs.existsSync(direct)) {
        foundPath = direct;
        break;
      }
    }

    if (!foundPath) {
      const cleanTarget = String(templateId).toLowerCase().replace(/[-_\s]+/g, '');
      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')) {
              const cleanFile = path.parse(file).name.toLowerCase().replace(/[-_\s]+/g, '');
              if (cleanFile === cleanTarget) {
                foundPath = path.join(dir, file);
                break;
              }
            }
          }
          if (foundPath) break;
        } catch (e) {}
      }
    }

    if (foundPath) {
      res.setHeader('Content-Type', foundPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(foundPath);
    }
    return res.status(404).send('Template image not found');
  } catch (err) {
    console.error('Preview stream error:', err);
    return res.status(500).send('Error loading preview');
  }
});

export default router;
