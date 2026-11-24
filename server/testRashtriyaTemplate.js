import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAvailableTemplates,
  getAwardTitle,
  getAwardCategory,
  generateCertificate
} from './services/certificateGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== Testing RASHTRIYA GAURAV RATAN SAMMAN Template ===');

  // 1. Verify getAvailableTemplates
  const templates = getAvailableTemplates();
  const template = templates.find(t => t.id === 'RASHTRIYA GAURAV RATAN SAMMAN');
  console.log('Found in getAvailableTemplates:', !!template);
  if (!template) {
    throw new Error('Template not found in getAvailableTemplates');
  }
  console.log('Template details:', template);

  // 2. Verify getAwardTitle & getAwardCategory
  const title = getAwardTitle('RASHTRIYA GAURAV RATAN SAMMAN');
  const cat = getAwardCategory('RASHTRIYA GAURAV RATAN SAMMAN');
  console.log('Award Title:', title);
  console.log('Award Category:', cat);

  // 3. Generate test certificate
  const testPhotoPath = '/Users/yashmalik/.gemini/antigravity/brain/14db6f7c-8d8b-4b86-8ab7-100a75e87d45/scratch/dr_vijay_extracted.png';
  const studentData = {
    fullName: 'Dr. Vijay Prakash Tiwari',
    cin_no: 'U85499DL2025NPL459383',
    licence_no: '176566',
    serial_no: '459383/IHRE0044',
    reg_no: '459383',
    certificateNumber: 'IHREO/CERT/2026/0044',
    photoUrl: testPhotoPath,
    letterIssuedAt: '2024-04-10'
  };

  console.log('Generating certificate with test data...');
  const result = await generateCertificate(studentData, 'RASHTRIYA GAURAV RATAN SAMMAN', 'https://ihreo.org');
  console.log('Generation success! Result files:', result);

  const outPdf = '/Users/yashmalik/.gemini/antigravity/brain/14db6f7c-8d8b-4b86-8ab7-100a75e87d45/scratch/test_rashtriya_generated.pdf';
  const outPng = '/Users/yashmalik/.gemini/antigravity/brain/14db6f7c-8d8b-4b86-8ab7-100a75e87d45/scratch/test_rashtriya_generated.png';

  if (result.pdfPath && fs.existsSync(result.pdfPath)) {
    fs.copyFileSync(result.pdfPath, outPdf);
    console.log('Copied PDF to:', outPdf);
  }
  if (result.pngPath && fs.existsSync(result.pngPath)) {
    fs.copyFileSync(result.pngPath, outPng);
    console.log('Copied PNG to:', outPng);
  }

  console.log('=== Test Completed Successfully ===');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
