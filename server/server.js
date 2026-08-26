import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/authRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';

import AdminUser from './models/AdminUser.js';
import Event from './models/Event.js';
import Subject from './models/Subject.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Also serve certificate templates statically if requested
const templatesDir = path.resolve(__dirname, '../src/assets/certificate-templates');
app.use('/assets/certificate-templates', express.static(templatesDir));

// Public verification route (no auth middleware required)
app.use('/api/verify', verifyRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificate-templates', templateRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/uploads', uploadRoutes);

// Root health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'WCAEO Certificate Backend Server', timestamp: new Date() });
});

// Database setup with Memory DB fallback
const setupDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/wcaeo';
  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Successfully connected to MongoDB daemon.');
  } catch (err) {
    console.log('Local MongoDB daemon not detected. Initializing embedded MongoMemoryServer fallback...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Successfully connected to MongoMemoryServer at ${uri}`);
  }

  // Seed default Admin User if not existing
  const seedUsername = process.env.ADMIN_SEED_USERNAME || 'wcaeo_admin';
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || 'Wc@eo#2026$Secure91';
  const existingAdmin = await AdminUser.findOne({ username: seedUsername });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(seedPassword, 10);
    await AdminUser.create({ username: seedUsername, passwordHash: hash });
    console.log(`Seeded default Admin account: ${seedUsername}`);
  }

  // Seed initial Events if empty
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    await Event.insertMany([
      { name: 'National Excellence Awards 2026', description: 'Annual honor ceremony for national achievers' },
      { name: 'Global Education & Leadership Summit', description: 'International academic conference & award ceremony' },
      { name: 'Sahitya & Cultural Recognition Ceremony', description: 'Honoring literary and cultural icons' }
    ]);
    console.log('Seeded initial Events collection.');
  }

  // Seed initial Subjects if empty
  const subjectCount = await Subject.countDocuments();
  if (subjectCount === 0) {
    await Subject.insertMany([
      { name: 'Social Service & Humanitarian Work' },
      { name: 'Higher Education & Research' },
      { name: 'Literature, Poetry & Arts' },
      { name: 'Business Leadership & Entrepreneurship' },
      { name: 'Healthcare & Medical Service' }
    ]);
    console.log('Seeded initial Subjects collection.');
  }
};

const PORT = process.env.PORT || 5050;

setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`WCAEO Backend Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Fatal database setup error:', err);
});
