import http from 'http';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path,
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

async function runTests() {
  console.log('--- RUNNING WCAEO BACKEND INTEGRATION & QR VERIFICATION TESTS ---');

  // 1. Login
  const loginRes = await request('/api/auth/login', 'POST', {
    username: 'wcaeo_admin',
    password: 'Wc@eo#2026$Secure91'
  });
  console.log('1. Auth Login Status:', loginRes.status);
  const token = loginRes.body.token;
  if (!token) throw new Error('Failed to retrieve token from login!');

  // 2. Fetch Events & Subjects
  const eventsRes = await request('/api/events', 'GET', null, token);
  const subjectsRes = await request('/api/subjects', 'GET', null, token);

  // 3. Create Student Record & Generate Certificates with Embedded QR Code
  const ts = Date.now();
  const certNo = `WCAEO/CERT/2026/TEST_${ts}`;
  const newStudent = {
    refno: `WCAEO/2026/TEST_${ts}`,
    certificateNumber: certNo,
    fullName: 'Dr. Sunita Williams',
    fathersHusbandName: 'Shri N. Williams',
    category: 'Science & Space Exploration',
    email: 'sunita.williams@example.com',
    phoneNumber: '+91 9876543210',
    letterIssuedAt: '2026-08-26',
    bloodGroup: 'O+',
    nationality: 'Indian',
    eventId: eventsRes.body[0]._id,
    subjectId: subjectsRes.body[0]._id,
    certificateTemplateIds: ['Bhartiya Samaj Seva award', 'Doctorate IHREO'],
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    status: 'Active'
  };

  const createRes = await request('/api/students', 'POST', newStudent, token);
  console.log('3. Create Student Status:', createRes.status);
  console.log('   Generated Certificate URLs with QR codes:', createRes.body.generatedCertificateUrls);
  const studentId = createRes.body._id;

  // 4. Test PUBLIC Verification API Route (No token passed!)
  const verifyRes = await request(`/api/verify/${encodeURIComponent(certNo)}`, 'GET');
  console.log('4. Public Verification API Status:', verifyRes.status);
  console.log('   Verification Result:', verifyRes.body);

  if (!verifyRes.body.valid || verifyRes.body.status !== 'Active') {
    throw new Error('Public verification test failed!');
  }

  // 5. Test Inactive Status Revocation Verification
  await request(`/api/students/${studentId}`, 'PUT', { status: 'Inactive' }, token);
  const verifyInactiveRes = await request(`/api/verify/${encodeURIComponent(certNo)}`, 'GET');
  console.log('5. Public Verification Inactive Status:', verifyInactiveRes.body);

  if (verifyInactiveRes.body.status !== 'Inactive') {
    throw new Error('Inactive revocation status verification failed!');
  }

  console.log('=== ALL BACKEND & QR VERIFICATION TESTS PASSED CLEANLY! ===');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
