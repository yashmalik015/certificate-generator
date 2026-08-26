import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, '../src/assets/certificate-templates');
const configDir = path.join(templatesDir, 'config');

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const templates = [
  { id: 'Bhartiya Samaj Seva award', title: 'BHARTIYA SAMAJ SEVA AWARD', color: '#b45309', border: '#78350f' },
  { id: 'Doctorate IHREO', title: 'HONORARY DOCTORATE DEGREE (IHREO)', color: '#1e3a8a', border: '#172554' },
  { id: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD', title: 'INTERNATIONAL BUSINESS EXCELLENCE AWARD', color: '#854d0e', border: '#713f12' },
  { id: 'International Best Enterpreneur', title: 'INTERNATIONAL BEST ENTREPRENEUR AWARD', color: '#9a3412', border: '#7c2d12' },
  { id: 'Lifetime Literary Achivement Award', title: 'LIFETIME LITERARY ACHIEVEMENT AWARD', color: '#4c1d95', border: '#3b0764' },
  { id: 'Sahitya Sewa Ratna Sammaan (1)', title: 'SAHITYA SEWA RATNA SAMMAAN (SPECIAL)', color: '#9f1239', border: '#881337' },
  { id: 'Sahitya Sewa Ratna Sammaan', title: 'SAHITYA SEWA RATNA SAMMAAN', color: '#be123c', border: '#9f1239' },
  { id: 'Shiksha Ratna Principal Award', title: 'SHIKSHA RATNA PRINCIPAL AWARD', color: '#047857', border: '#065f46' },
  { id: 'bibhuti puraskar', title: 'BIBHUTI PURASKAR', color: '#6b21a8', border: '#581c87' },
  { id: 'laureate Certificate IHREO', title: 'LAUREATE CERTIFICATE OF IHREO', color: '#1d4ed8', border: '#1e40af' },
  { id: 'rashtriya padma bhushan samman', title: 'RASHTRIYA PADMA BHUSHAN SAMMAN', color: '#b45309', border: '#92400e' },
  { id: 'women icon award', title: 'WOMEN ICON OF THE YEAR AWARD', color: '#be185d', border: '#9d174d' }
];

const width = 2400;
const height = 1600;

templates.forEach((t) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(0, 0, width, height);

  // Outer Border Pattern
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 6;
  ctx.strokeRect(65, 65, width - 130, height - 130);

  ctx.strokeStyle = t.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 80, width - 160, height - 160);

  // Corner Accents
  const cornerSize = 120;
  const corners = [
    [65, 65],
    [width - 65, 65],
    [65, height - 65],
    [width - 65, height - 65]
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = t.border;
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();
  });

  // Header Institution
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 38px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WORLD COUNCIL OF ACADEMIC & EDUCATIONAL ORGANIZATIONS', width / 2, 180);

  ctx.fillStyle = '#64748b';
  ctx.font = '24px sans-serif';
  ctx.fillText('AN INTERNATIONAL ACCREDITATION & HONORS COUNCIL (WCAEO)', width / 2, 225);

  // Decorative Ribbon / Emblem
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(width / 2 - 350, 260, 700, 4);

  // Main Certificate Title
  ctx.fillStyle = t.color;
  ctx.font = 'bold 58px serif';
  ctx.fillText(t.title, width / 2, 360);

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(width / 2 - 450, 400, 900, 4);

  // Presenter line
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 30px serif';
  ctx.fillText('This Certificate of Honor & Distinction is Proudly Presented To', width / 2, 480);

  // Placeholder Line for Full Name (Background template leaves space)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 600, 620);
  ctx.lineTo(width / 2 + 600, 620);
  ctx.stroke();

  // For Contribution In
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 28px serif';
  ctx.fillText('For Outstanding Dedication, Meritorious Service & Distinction In', width / 2, 690);

  // Category underline placeholder
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 450, 790);
  ctx.lineTo(width / 2 + 450, 790);
  ctx.stroke();

  // Photo Frame Box Placeholder (centered at x=1080, y=840, 240x240)
  const photoBoxX = width / 2 - 120;
  const photoBoxY = 840;
  const photoBoxSize = 240;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize);

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.strokeRect(photoBoxX + 4, photoBoxY + 4, photoBoxSize - 8, photoBoxSize - 8);

  // Gold Seal Graphic (Bottom Left)
  const sealX = 320;
  const sealY = 1320;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(sealX, sealY, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL', sealX, sealY - 15);
  ctx.fillText('WCAEO', sealX, sealY + 10);
  ctx.fillText('SEAL', sealX, sealY + 35);

  // Signatures
  // Left signature
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600, 1380);
  ctx.lineTo(950, 1380);
  ctx.stroke();
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Authorized Registrar', 775, 1420);

  // Right signature
  ctx.beginPath();
  ctx.moveTo(1450, 1380);
  ctx.lineTo(1800, 1380);
  ctx.stroke();
  ctx.fillText('Chairman / President', 1625, 1420);

  // Save template PNG file
  const pngPath = path.join(templatesDir, `${t.id}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, buffer);
  console.log(`Generated template PNG: ${pngPath}`);

  // Create corresponding JSON config map
  const config = {
    templateFile: `${t.id}.png`,
    fields: {
      fullName: { x: width / 2, y: 590, fontSize: 56, font: 'bold serif', color: '#0f172a', align: 'center' },
      category: { x: width / 2, y: 760, fontSize: 34, font: 'bold sans-serif', color: t.color, align: 'center' },
      refno: { x: 300, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'left' },
      certificateNumber: { x: width / 2, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'center' },
      letterIssuedAt: { x: width - 300, y: 1475, fontSize: 22, font: 'bold sans-serif', color: '#475569', align: 'right' }
    },
    photo: { x: photoBoxX, y: photoBoxY, width: photoBoxSize, height: photoBoxSize },
    qrCode: { x: 2050, y: 100, size: 180 }
  };

  const jsonPath = path.join(configDir, `${t.id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2));
  console.log(`Generated template config JSON: ${jsonPath}`);
});

console.log('All 12 template PNGs and JSON configs generated successfully!');
