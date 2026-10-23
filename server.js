const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static Assets
app.use(express.static(path.join(__dirname)));

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Health & Dashboard Stats
app.get('/api/health', (req, res) => {
  const applications = db.get('applications');
  const notes = db.get('notes');
  const posts = db.get('community_posts');
  const projects = db.get('projects');
  const inquiries = db.get('contact_inquiries');

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    platform: 'UNIMATE Student Operating System',
    metrics: {
      totalApplications: applications.length,
      pendingReviews: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
      totalNotes: notes.length,
      totalDownloads: notes.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
      communityDiscussions: posts.length,
      activeProjects: projects.length,
      contactInquiries: inquiries.length
    }
  });
});

// 2. Internships & Opportunities
app.get('/api/internships', (req, res) => {
  const roles = db.get('internships');
  res.json({ success: true, count: roles.length, roles });
});

// Application submission
app.post('/api/applications', (req, res) => {
  const { fullName, email, phone, university, branch, year, roleId, roleTitle, github, linkedin, sop } = req.body;

  if (!fullName || !email || !university || !branch) {
    return res.status(400).json({ success: false, error: 'Full name, email, university and branch are required.' });
  }

  // Generate unique tracking ID
  const trackingNumber = Math.floor(1000 + Math.random() * 9000);
  const newApp = {
    id: `APP-${trackingNumber}`,
    roleId: roleId || 'role-custom',
    roleTitle: roleTitle || 'Core Contributor Intern',
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    university: university.trim(),
    branch: branch.trim(),
    year: year || '2nd Year',
    github: github ? github.trim() : '',
    linkedin: linkedin ? linkedin.trim() : '',
    sop: sop ? sop.trim() : '',
    status: 'under_review',
    submittedAt: new Date().toISOString()
  };

  db.insert('applications', newApp);

  res.status(201).json({
    success: true,
    message: 'Application received successfully! Our team will review your profile.',
    trackingId: newApp.id,
    application: newApp
  });
});

// Track application status by Tracking ID or Email
app.get('/api/applications/track/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const applications = db.get('applications');

  const match = applications.find(
    app => app.id.toLowerCase() === query || app.email.toLowerCase() === query
  );

  if (!match) {
    return res.status(404).json({
      success: false,
      error: `No application found for "${req.params.query}". Please check your Tracking ID (e.g. APP-1021) or email address.`
    });
  }

  res.json({
    success: true,
    application: {
      id: match.id,
      fullName: match.fullName,
      roleTitle: match.roleTitle,
      university: match.university,
      status: match.status,
      submittedAt: match.submittedAt
    }
  });
});

// List all applications (for Admin / Student Portal)
app.get('/api/applications', (req, res) => {
  const applications = db.get('applications');
  res.json({ success: true, count: applications.length, applications });
});

// Update application status
app.patch('/api/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'under_review', 'interview_scheduled', 'accepted', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const updated = db.update('applications', app => app.id === id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  res.json({ success: true, message: `Status updated to ${status}`, application: updated });
});

// 3. Academic Support & Notes
app.get('/api/notes', (req, res) => {
  let notes = db.get('notes');
  const { branch, semester, type, search } = req.query;

  if (branch && branch !== 'all') {
    notes = notes.filter(n => n.branch.toLowerCase().includes(branch.toLowerCase()));
  }

  if (semester && semester !== 'all') {
    notes = notes.filter(n => String(n.semester) === String(semester));
  }

  if (type && type !== 'all') {
    notes = notes.filter(n => n.type.toLowerCase() === type.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.subject.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, count: notes.length, notes });
});

// Contribute notes
app.post('/api/notes', (req, res) => {
  const { title, subject, branch, semester, type, author, downloadUrl, tags } = req.body;

  if (!title || !subject || !branch) {
    return res.status(400).json({ success: false, error: 'Title, subject and branch are required.' });
  }

  const newNote = {
    id: `note-${Date.now()}`,
    title: title.trim(),
    subject: subject.trim(),
    branch: branch.trim(),
    semester: Number(semester) || 1,
    type: type || 'Notes',
    author: author ? author.trim() : 'Anonymous Student',
    downloads: 1,
    fileSize: '2.5 MB',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(s => s.trim()) : ['Verified']),
    downloadUrl: downloadUrl || '#',
    verified: true,
    createdAt: new Date().toISOString()
  };

  db.insert('notes', newNote);

  res.status(201).json({
    success: true,
    message: 'Notes added to the UNIMATE academic library! Thank you for contributing.',
    note: newNote
  });
});

// Increment download counter
app.post('/api/notes/:id/download', (req, res) => {
  const { id } = req.params;
  const notes = db.get('notes');
  const note = notes.find(n => n.id === id);

  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  const updated = db.update('notes', n => n.id === id, { downloads: (note.downloads || 0) + 1 });
  res.json({ success: true, downloads: updated.downloads });
});

// 4. Community & Discussion Feed
app.get('/api/community/posts', (req, res) => {
  let posts = db.get('community_posts');
  const { channel, search } = req.query;

  if (channel && channel !== 'all') {
    posts = posts.filter(p => p.channel === channel);
  }

  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, count: posts.length, posts });
});

// Create community post
app.post('/api/community/posts', (req, res) => {
  const { authorName, authorRole, channel, title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required.' });
  }

  const colors = ['#1d68f5', '#059669', '#7c3aed', '#ea580c', '#0284c7'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newPost = {
    id: `post-${Date.now()}`,
    authorName: authorName ? authorName.trim() : 'Anonymous Scholar',
    authorRole: authorRole ? authorRole.trim() : 'UNIMATE Member',
    avatarColor: randomColor,
    channel: channel || 'general',
    title: title.trim(),
    content: content.trim(),
    likes: 1,
    likedBy: [],
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(s => s.trim().replace(/^#/, '')) : ['Community']),
    createdAt: new Date().toISOString(),
    replies: []
  };

  db.insert('community_posts', newPost);

  res.status(201).json({
    success: true,
    message: 'Post published to the community feed!',
    post: newPost
  });
});

// Like a post
app.post('/api/community/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const posts = db.get('community_posts');
  const post = posts.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const updated = db.update('community_posts', p => p.id === id, { likes: (post.likes || 0) + 1 });
  res.json({ success: true, likes: updated.likes });
});

// Reply to a post
app.post('/api/community/posts/:id/reply', (req, res) => {
  const { id } = req.params;
  const { authorName, authorRole, content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, error: 'Reply content cannot be empty.' });
  }

  const posts = db.get('community_posts');
  const post = posts.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const newReply = {
    id: `rep-${Date.now()}`,
    authorName: authorName ? authorName.trim() : 'Student Peer',
    authorRole: authorRole ? authorRole.trim() : 'Community Member',
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  const updatedReplies = [...(post.replies || []), newReply];
  const updated = db.update('community_posts', p => p.id === id, { replies: updatedReplies });

  res.status(201).json({
    success: true,
    message: 'Reply posted!',
    reply: newReply,
    totalReplies: updated.replies.length
  });
});

// 5. Projects & Team-ups
app.get('/api/projects', (req, res) => {
  const projects = db.get('projects');
  res.json({ success: true, count: projects.length, projects });
});

// Join project team
app.post('/api/projects/:id/join', (req, res) => {
  const { id } = req.params;
  const { name, email, college, roleInterested, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  const projects = db.get('projects');
  const project = projects.find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const joinRequest = {
    id: `join-${Date.now()}`,
    projectId: id,
    projectTitle: project.title,
    name: name.trim(),
    email: email.trim(),
    college: college ? college.trim() : '',
    roleInterested: roleInterested ? roleInterested.trim() : 'Contributor',
    message: message ? message.trim() : '',
    submittedAt: new Date().toISOString()
  };

  db.insert('project_applications', joinRequest);

  res.status(201).json({
    success: true,
    message: `Team interest received for "${project.title}"! The project lead will reach out to you.`,
    request: joinRequest
  });
});

// 6. Mentorship Session Booking
app.post('/api/mentorship/book', (req, res) => {
  const { studentName, studentEmail, domain, preferredDate, message } = req.body;

  if (!studentName || !studentEmail || !domain) {
    return res.status(400).json({ success: false, error: 'Name, email, and mentorship domain are required.' });
  }

  const newBooking = {
    id: `ment-${Date.now()}`,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim(),
    domain: domain.trim(),
    preferredDate: preferredDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    message: message ? message.trim() : '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  db.insert('mentorship_bookings', newBooking);

  res.status(201).json({
    success: true,
    message: 'Mentorship session requested! A calendar invite will be sent to your email.',
    booking: newBooking
  });
});

// 7. Contact Inquiries & Newsletter
app.post('/api/contact', (req, res) => {
  const { name, email, subject, category, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
  }

  const inquiry = {
    id: `con-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    subject: subject ? subject.trim() : 'General Inquiry',
    category: category || 'General',
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  db.insert('contact_inquiries', inquiry);

  res.status(201).json({
    success: true,
    message: 'Thanks! Your inquiry has been logged. We will get back to you shortly.',
    inquiry
  });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  const subscribers = db.get('subscribers');
  if (!subscribers.includes(email.toLowerCase())) {
    subscribers.push(email.toLowerCase());
    db.save();
  }

  res.status(201).json({
    success: true,
    message: 'Subscribed! You will receive our weekly student digest and opportunity alerts.'
  });
});

// Catch-all 404 for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 UNIMATE Full-Stack Platform running on:`);
  console.log(`👉 Local: http://localhost:${PORT}`);
  console.log(`👉 API Health: http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});
