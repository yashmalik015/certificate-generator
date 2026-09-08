import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateCertificate,
  generateIdCard,
  generateMembershipCert,
  getAvailableTemplates
} from './services/certificateGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAll() {
  console.log('=== TESTING CERTIFICATE GENERATOR FOR ALL TEMPLATES ===\n');

  const templates = getAvailableTemplates();
  console.log('Available Templates in list:');
  templates.forEach((t) => console.log(` - [${t.category}] ${t.id} -> ${t.label}`));

  // Generate a mock photo (circle avatar) for test
  const { createCanvas } = await import('canvas');
  const photoCanvas = createCanvas(300, 300);
  const pCtx = photoCanvas.getContext('2d');
  pCtx.fillStyle = '#1e3a8a';
  pCtx.fillRect(0, 0, 300, 300);
  pCtx.fillStyle = '#f8fafc';
  pCtx.font = 'bold 120px sans-serif';
  pCtx.textAlign = 'center';
  pCtx.textBaseline = 'middle';
  pCtx.fillText('RK', 150, 150);
  const testPhotoDataUrl = photoCanvas.toDataURL('image/jpeg');

  const studentData = {
    refno: 'IHREO/2026/040',
    certificateNumber: 'IHREO/CERT/2026/0040',
    fullName: 'DR. RAJESH KUMAR SHARMA',
    category: 'Excellence in Humanitarian Services & Social Upliftment',
    designation: 'National Director',
    nationality: 'Indian',
    letterIssuedAt: '2026-09-08',
    photoUrl: testPhotoDataUrl
  };

  const results = [];

  for (const t of templates) {
    console.log(`\nGenerating Certificate for template: "${t.id}"...`);
    const res = await generateCertificate(studentData, t.id);
    console.log(` -> Generated: PDF=${res.pdfUrl}, PNG=${res.pngUrl}`);
    results.push(res);
  }

  console.log('\nGenerating Universal ID Card...');
  const idRes = await generateIdCard(studentData);
  console.log(` -> Generated ID Card: PDF=${idRes.pdfUrl}`);

  console.log('\nGenerating Universal Membership Certificate...');
  const memRes = await generateMembershipCert(studentData);
  console.log(` -> Generated Membership: PDF=${memRes.pdfUrl}`);

  console.log('\n=== ALL GENERATIONS COMPLETED SUCCESSFULLY! ===');
}

testAll().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
