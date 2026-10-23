// Comprehensive Automated End-to-End Verification Test
const app = require('./server');
const http = require('http');

let server;
const PORT = 3456;

function runRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting UNIMATE End-to-End Test Suite ---\n');

  server = app.listen(PORT, '127.0.0.1');
  await new Promise(r => setTimeout(r, 500));

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health & System Metrics
  await test('GET /api/health returns online status and metrics', async () => {
    const res = await runRequest({ port: PORT, path: '/api/health', method: 'GET' });
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (res.data.status !== 'online') throw new Error('Status not online');
    if (!res.data.metrics || res.data.metrics.totalApplications === undefined) throw new Error('Missing metrics');
  });

  // 2. Internships
  await test('GET /api/internships returns open roles', async () => {
    const res = await runRequest({ port: PORT, path: '/api/internships', method: 'GET' });
    if (res.status !== 200 || !res.data.roles || res.data.roles.length === 0) throw new Error('No roles returned');
  });

  // 3. Application Submission & Tracking
  let createdTrackingId = '';
  await test('POST /api/applications submits new applicant', async () => {
    const payload = {
      fullName: 'EndToEnd Test Scholar',
      email: 'testscholar@university.edu',
      university: 'National Institute of Tech',
      branch: 'Computer Science',
      year: '3rd Year',
      roleTitle: 'Core Contributor Intern',
      sop: 'Passionate about educational software.'
    };
    const res = await runRequest({
      port: PORT,
      path: '/api/applications',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);
    if (res.status !== 201 || !res.data.trackingId) throw new Error('Application creation failed');
    createdTrackingId = res.data.trackingId;
  });

  await test('GET /api/applications/track/:query tracks submitted application', async () => {
    const res = await runRequest({ port: PORT, path: `/api/applications/track/${createdTrackingId}`, method: 'GET' });
    if (res.status !== 200 || res.data.application.id !== createdTrackingId) throw new Error('Tracking failed');
  });

  await test('PATCH /api/applications/:id/status updates status', async () => {
    const res = await runRequest({
      port: PORT,
      path: `/api/applications/${createdTrackingId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'accepted' });
    if (res.status !== 200 || res.data.application.status !== 'accepted') throw new Error('Status patch failed');
  });

  // 4. Academic Notes
  let createdNoteId = '';
  await test('POST /api/notes contributes study resource', async () => {
    const payload = {
      title: 'Automata Theory Quick Revision',
      subject: 'Theory of Computation',
      branch: 'Computer Science',
      semester: 5,
      type: 'Notes',
      author: 'Test Scholar Lead',
      tags: 'TOC,DFA,NFA,Turing'
    };
    const res = await runRequest({
      port: PORT,
      path: '/api/notes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);
    if (res.status !== 201 || !res.data.note.id) throw new Error('Note creation failed');
    createdNoteId = res.data.note.id;
  });

  await test('POST /api/notes/:id/download increments downloads', async () => {
    const res = await runRequest({
      port: PORT,
      path: `/api/notes/${createdNoteId}/download`,
      method: 'POST'
    });
    if (res.status !== 200 || res.data.downloads < 2) throw new Error('Download increment failed');
  });

  // 5. Community Posts, Like, Reply
  let createdPostId = '';
  await test('POST /api/community/posts creates discussion', async () => {
    const payload = {
      title: 'How do you structure Git branches for hackathons?',
      content: 'Any tips on feature branching vs trunk based development?',
      channel: 'hackathons',
      authorName: 'Rohan Test',
      tags: 'Git,Teamwork'
    };
    const res = await runRequest({
      port: PORT,
      path: '/api/community/posts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);
    if (res.status !== 201 || !res.data.post.id) throw new Error('Post creation failed');
    createdPostId = res.data.post.id;
  });

  await test('POST /api/community/posts/:id/like increments like counter', async () => {
    const res = await runRequest({
      port: PORT,
      path: `/api/community/posts/${createdPostId}/like`,
      method: 'POST'
    });
    if (res.status !== 200 || res.data.likes < 2) throw new Error('Like increment failed');
  });

  await test('POST /api/community/posts/:id/reply posts comment', async () => {
    const res = await runRequest({
      port: PORT,
      path: `/api/community/posts/${createdPostId}/reply`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { authorName: 'Senior Dev', content: 'Use short lived feature branches!' });
    if (res.status !== 201 || res.data.totalReplies < 1) throw new Error('Reply creation failed');
  });

  // 6. Project Team-Ups
  await test('POST /api/projects/:id/join applies for project team', async () => {
    const res = await runRequest({
      port: PORT,
      path: '/api/projects/proj-1/join',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Kavya', email: 'kavya@test.edu', roleInterested: 'Frontend Developer', message: 'Ready to build' });
    if (res.status !== 201 || !res.data.request.id) throw new Error('Project application failed');
  });

  await test('GET /api/project-applications lists teammate requests', async () => {
    const res = await runRequest({ port: PORT, path: '/api/project-applications', method: 'GET' });
    if (res.status !== 200 || !res.data.applications) throw new Error('Failed to list team requests');
  });

  // 7. Mentorship Booking
  await test('POST /api/mentorship/book creates mentorship booking', async () => {
    const res = await runRequest({
      port: PORT,
      path: '/api/mentorship/book',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { studentName: 'Aditya', studentEmail: 'aditya@test.edu', domain: 'Cloud & DevOps' });
    if (res.status !== 201 || !res.data.booking.id) throw new Error('Mentorship booking failed');
  });

  // 8. Contact & Newsletter
  await test('POST /api/contact logs general enquiry', async () => {
    const res = await runRequest({
      port: PORT,
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Priya', email: 'priya@test.edu', message: 'Hello UNIMATE team' });
    if (res.status !== 201 || !res.data.inquiry.id) throw new Error('Contact enquiry failed');
  });

  await test('POST /api/newsletter subscribes student email', async () => {
    const res = await runRequest({
      port: PORT,
      path: '/api/newsletter',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'weeklydigest@college.edu' });
    if (res.status !== 201) throw new Error('Newsletter subscription failed');
  });

  // 9. Static Clean URL Routes
  await test('GET / serves index.html', async () => {
    const res = await runRequest({ port: PORT, path: '/', method: 'GET' });
    if (res.status !== 200 || !res.text.includes('UNIMATE')) throw new Error('Root route failed');
  });

  await test('GET /portal serves portal.html with clean URL', async () => {
    const res = await runRequest({ port: PORT, path: '/portal', method: 'GET' });
    if (res.status !== 200 || !res.text.includes('Operations Dashboard')) throw new Error('Clean /portal URL failed');
  });

  await test('GET /unknown-random-route serves custom 404 page', async () => {
    const res = await runRequest({ port: PORT, path: '/non-existent-random-page', method: 'GET' });
    if (res.status !== 404 || !res.text.includes('404')) throw new Error('Custom 404 failed');
  });

  // Clean up
  server.close();
  console.log(`\n==================================================`);
  console.log(`Test Results: ${passed}/${total} passed`);
  if (passed === total) {
    console.log(`🎉 ALL TESTS PASSED! FULL-STACK PLATFORM IS READY FOR DEPLOYMENT!`);
    console.log(`==================================================\n`);
    process.exit(0);
  } else {
    console.error(`❌ Some tests failed.`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  if (server) server.close();
  process.exit(1);
});
