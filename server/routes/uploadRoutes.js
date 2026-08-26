import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const photosDir = isVercel
  ? path.join('/tmp', 'uploads', 'photos')
  : path.resolve(__dirname, '../uploads/photos');

try {
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }
} catch (mkdirErr) {
  console.warn('Photos directory setup warning:', mkdirErr.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
      }
    } catch {}
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = express.Router();

router.post('/photo', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file uploaded.' });
    }
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    return res.json({ photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ error: 'Failed to save photo.' });
  }
});

export default router;
