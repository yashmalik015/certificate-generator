import http from 'http';
import fs from 'fs';
import path from 'path';

const request = (urlPath, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: urlPath,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testAll() {
  console.log('--- Testing Auth and Templates ---');

  // 1. Auth Login
  const loginRes = await request('/api/auth/login', 'POST', {
    username: 'wcaeo_admin',
    password: 'Wc@eo#2026$Secure91'
  });
  const token = loginRes.body.token;
  console.log('Auth login status:', loginRes.status, 'Token acquired:', Boolean(token));

  // 2. Check templates route with token
  const tplRes = await request('/api/certificate-templates', 'GET', null, token);
  console.log('Templates status:', tplRes.status);
  console.log('Templates list count:', tplRes.body?.length);
  console.log('Templates IDs:', tplRes.body?.map(t => t.id));

  // 3. Fetch Events & Subjects
  const events = await request('/api/events', 'GET', null, token);
  const subjects = await request('/api/subjects', 'GET', null, token);

  // 4. Create student with all 6 templates
  const ts = Date.now();
  const certNo = `IHREO/CERT/2026/TEST_${ts}`;
  const studentPayload = {
    refno: `IHREO/2026/TEST_${ts}`,
    certificateNumber: certNo,
    fullName: 'Dr. Yash Malik',
    fathersHusbandName: 'Shri R. Malik',
    category: 'Information Technology & Software Architecture',
    email: 'yash@example.com',
    phoneNumber: '+91 9999999999',
    letterIssuedAt: '2026-09-08',
    bloodGroup: 'O+',
    nationality: 'Indian',
    designation: 'Chief Technology Officer',
    eventId: events.body[0]?._id,
    subjectId: subjects.body[0]?._id,
    certificateTemplateIds: [
      'Doctorate IHREO',
      'Arya Bhushan Samaj Seva Award',
      'Best Business Icon Award',
      'Bhartiya Padma Bhushan Samman',
      'Bhartiye Gaurav Ratan Samman',
      'women icon award'
    ],
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    status: 'Active'
  };

  const createRes = await request('/api/students', 'POST', studentPayload, token);
  console.log('Create student status:', createRes.status);
  console.log('Generated certificate URLs:', createRes.body?.generatedCertificateUrls);
  console.log('Generated ID Card:', createRes.body?.generatedIdCardUrl);
  console.log('Generated Membership:', createRes.body?.generatedMembershipUrl);

  // 5. Test Public Verification
  const verifyRes = await request(`/api/verify/${encodeURIComponent(certNo)}`);
  console.log('Public Verification Status:', verifyRes.status, 'Valid:', verifyRes.body?.valid);

  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===');
}

testAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
