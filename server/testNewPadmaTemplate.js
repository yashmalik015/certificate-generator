import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { getAvailableTemplates, generateCertificate, getAwardTitle, getAwardCategory } from './services/certificateGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- 1. Testing getAvailableTemplates() ---');
  const templates = getAvailableTemplates();
  console.log('Available template count:', templates.length);
  const padmaTpl = templates.find(t => t.id === 'Bhartiya Padma Bhushan Samman');
  if (!padmaTpl) {
    throw new Error('Bhartiya Padma Bhushan Samman template not found in getAvailableTemplates()');
  }
  console.log('✓ Padma Bhushan Template entry:', padmaTpl);

  console.log('\n--- 2. Testing Award Title & Category ---');
  console.log('Title:', getAwardTitle('Bhartiya Padma Bhushan Samman'));
  console.log('Category:', getAwardCategory('Bhartiya Padma Bhushan Samman'));

  console.log('\n--- 3. Testing Generate Certificate (Standard Name & Reference Photo) ---');
  const student1 = {
    refno: 'IHREO/2026/040',
    certificateNumber: 'IHREO/CERT/2026/0040',
    fullName: 'Dr. Mizanur Rahaman',
    category: 'Education & Social Work',
    cin_no: 'U85499DL2025NPL459383',
    licence_no: '176566',
    reg_no: '459383',
    serial_no: '459383/IHREO0216',
    photoUrl: '/tmp/dr_mizanur_color.jpg',
    letterIssuedAt: new Date('2026-09-16T00:00:00.000Z')
  };

  const res1 = await generateCertificate(student1, 'Bhartiya Padma Bhushan Samman', 'https://ihreo.org');
  console.log('Result 1:', { templateId: res1.templateId, pdfUrl: res1.pdfUrl, pngUrl: res1.pngUrl, hasPdfBytes: Boolean(res1.pdfBytes) });

  const pdf1Bytes = fs.readFileSync(path.resolve(__dirname, res1.pdfUrl.replace(/^\//, '')));
  const doc1 = await PDFDocument.load(pdf1Bytes);
  const page1 = doc1.getPage(0);
  const size1 = page1.getSize();
  console.log('PDF 1 dimensions:', size1);
  if (Math.abs(size1.width - 597.20) > 2 || Math.abs(size1.height - 843.92) > 2) {
    throw new Error(`Unexpected PDF dimensions: ${size1.width} x ${size1.height}`);
  }
  console.log('✓ Standard certificate generated with exact A4 portrait dimensions!');

  console.log('\n--- 4. Testing Long Recipient Name (Font Scaling) ---');
  const studentLong = {
    refno: 'IHREO/2026/099',
    certificateNumber: 'IHREO/CERT/2026/0099',
    fullName: 'Prof. Dr. Venkatanarasimha Raju Ramachandra Rao Koruth James',
    category: 'National Education & Social Leadership',
    cin_no: 'U85499DL2025NPL459383',
    licence_no: '176566',
    reg_no: '459383',
    photoUrl: path.resolve(__dirname, 'uploads/photos/test_photo.jpg'),
    letterIssuedAt: new Date('2026-11-08T00:00:00.000Z')
  };

  const resLong = await generateCertificate(studentLong, 'Bhartiya Padma Bhushan Samman', 'https://ihreo.org');
  console.log('✓ Long name certificate generated successfully:', resLong.pdfUrl);

  console.log('\n--- 5. Testing Existing Templates (Backward Compatibility) ---');
  const resDoctorate = await generateCertificate(student1, 'Doctorate IHREO', 'https://ihreo.org');
  console.log('✓ Doctorate IHREO generated successfully:', resDoctorate.pdfUrl);

  const resIdCard = await generateCertificate(student1, 'universal-id-card', 'https://ihreo.org');
  console.log('✓ Universal ID Card generated successfully:', resIdCard.pdfUrl);

  const resMembership = await generateCertificate(student1, 'universal-membership-certificate', 'https://ihreo.org');
  console.log('✓ Universal Membership Cert generated successfully:', resMembership.pdfUrl);

  console.log('\n========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

