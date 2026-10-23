require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const startTime = Date.now();

// Security Headers (Configured to permit Google Fonts, SVG icons, and inline scripts/styles for UI)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Compression & Body Parsers
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Static Assets & Files (with automatic .html resolution)
app.use(
  express.static(path.join(__dirname), {
    extensions: ['html', 'htm'],
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
  })
);

// Explicit Clean Page Routes
const cleanPages = [
  { path: '/', file: 'index.html' },
  { path: '/home', file: 'index.html' },
  { path: '/learning-paths', file: 'learning-paths.html' },
  { path: '/academic-support', file: 'academic-support.html' },
  { path: '/projects', file: 'projects.html' },
  { path: '/internships', file: 'internships.html' },
  { path: '/community', file: 'community.html' },
  { path: '/training-mentorship', file: 'training-mentorship.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/portal', file: 'portal.html' }
];

cleanPages.forEach((route) => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, route.file));
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Health & Platform Dashboard Metrics
app.get('/api/health', (req, res) => {
  const applications = db.get('applications');
  const notes = db.get('notes');
  const posts = db.get('community_posts');
  const projects = db.get('projects');
  const inquiries = db.get('contact_inquiries');
  const projectApps = db.get('project_applications');
  const mentorshipBookings = db.get('mentorship_bookings');
  const subscribers = db.get('subscribers');

  const uptimeSec = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
    uptimeSeconds: uptimeSec,
    platform: 'UNIMATE Student Operating System',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    metrics: {
      totalApplications: applications.length,
      pendingReviews: applications.filter((a) => a.status === 'pending' || a.status === 'under_review').length,
      acceptedApplications: applications.filter((a) => a.status === 'accepted' || a.status === 'interview_scheduled').length,
      totalNotes: notes.length,
      totalDownloads: notes.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
      communityDiscussions: posts.length,
      activeProjects: projects.length,
      projectApplications: projectApps.length,
      mentorshipBookings: mentorshipBookings.length,
      contactInquiries: inquiries.length,
      newsletterSubscribers: subscribers.length
    }
  });
});

// Alias for stats
app.get('/api/system/stats', (req, res) => {
  res.redirect('/api/health');
});

// Database Export (For Operations / Backup)
app.get('/api/system/export', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename=unimate-database-backup.json');
  res.setHeader('Content-Type', 'application/json');
  res.json(db.exportAll());
});

// 2. Internships & Student Applications
app.get('/api/internships', (req, res) => {
  const roles = db.get('internships');
  res.json({ success: true, count: roles.length, roles });
});

// Submit Internship Application
app.post('/api/applications', (req, res) => {
  const { fullName, email, phone, university, branch, year, roleId, roleTitle, github, linkedin, sop } = req.body;

  if (!fullName || !email || !university) {
    return res.status(400).json({ success: false, error: 'Full name, email and university are required.' });
  }

  const trackingNumber = Math.floor(1000 + Math.random() * 9000);
  const newApp = {
    id: `APP-${trackingNumber}`,
    roleId: roleId || 'role-custom',
    roleTitle: roleTitle || 'Core Contributor Intern',
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    university: university.trim(),
    branch: branch ? branch.trim() : 'Undergraduate',
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

// Track Application Status by Tracking ID or Email
app.get('/api/applications/track/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const applications = db.get('applications');

  const match = applications.find(
    (app) => app.id.toLowerCase() === query || app.email.toLowerCase() === query
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
      email: match.email,
      roleTitle: match.roleTitle,
      university: match.university,
      branch: match.branch,
      status: match.status,
      submittedAt: match.submittedAt
    }
  });
});

// List all applications with filtering
app.get('/api/applications', (req, res) => {
  let applications = db.get('applications');
  const { status, search } = req.query;

  if (status && status !== 'all') {
    applications = applications.filter((a) => a.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    applications = applications.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.university.toLowerCase().includes(q) ||
        a.roleTitle.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: applications.length, applications });
});

// Update application status
app.patch('/api/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'under_review', 'interview_scheduled', 'accepted', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
  }

  const updated = db.update('applications', (app) => app.id === id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  res.json({ success: true, message: `Status updated to ${status}`, application: updated });
});

// Delete application
app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('applications', (a) => a.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }
  res.json({ success: true, message: 'Application deleted successfully' });
});

// 3. Academic Support & Notes Library
app.get('/api/notes', (req, res) => {
  let notes = db.get('notes');
  const { branch, semester, type, search } = req.query;

  if (branch && branch !== 'all') {
    notes = notes.filter((n) => n.branch.toLowerCase().includes(branch.toLowerCase()));
  }

  if (semester && semester !== 'all') {
    notes = notes.filter((n) => String(n.semester) === String(semester));
  }

  if (type && type !== 'all') {
    notes = notes.filter((n) => n.type.toLowerCase() === type.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
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
    fileSize: '3.2 MB',
    tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((s) => s.trim().replace(/^#/, '')) : ['Verified'],
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
  const note = notes.find((n) => n.id === id);

  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  const updated = db.update('notes', (n) => n.id === id, { downloads: (note.downloads || 0) + 1 });
  res.json({ success: true, downloads: updated.downloads });
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('notes', (n) => n.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }
  res.json({ success: true, message: 'Note deleted from library' });
});

// 4. Community & Discussion Feed
app.get('/api/community/posts', (req, res) => {
  let posts = db.get('community_posts');
  const { channel, search } = req.query;

  if (channel && channel !== 'all') {
    posts = posts.filter((p) => p.channel === channel);
  }

  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
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
    tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((s) => s.trim().replace(/^#/, '')) : ['Community'],
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
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const updated = db.update('community_posts', (p) => p.id === id, { likes: (post.likes || 0) + 1 });
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
  const post = posts.find((p) => p.id === id);

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
  const updated = db.update('community_posts', (p) => p.id === id, { replies: updatedReplies });

  res.status(201).json({
    success: true,
    message: 'Reply posted!',
    reply: newReply,
    totalReplies: updated.replies.length
  });
});

// Delete post
app.delete('/api/community/posts/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('community_posts', (p) => p.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }
  res.json({ success: true, message: 'Post deleted successfully' });
});

// 5. Projects & Team-Ups
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
  const project = projects.find((p) => p.id === id) || projects[0];

  const joinRequest = {
    id: `join-${Date.now()}`,
    projectId: id,
    projectTitle: project ? project.title : (roleInterested || 'Collaborative Project'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    college: college ? college.trim() : '',
    roleInterested: roleInterested ? roleInterested.trim() : 'Contributor',
    message: message ? message.trim() : '',
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  db.insert('project_applications', joinRequest);

  res.status(201).json({
    success: true,
    message: `Team interest received for "${joinRequest.projectTitle}"! The team lead will reach out to you.`,
    request: joinRequest
  });
});

// List all project team applications
app.get('/api/project-applications', (req, res) => {
  const list = db.get('project_applications');
  res.json({ success: true, count: list.length, applications: list });
});

// Update project team application status
app.patch('/api/project-applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.update('project_applications', (a) => a.id === id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }
  res.json({ success: true, message: `Application status updated to ${status}`, application: updated });
});

// Delete project application
app.delete('/api/project-applications/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('project_applications', (a) => a.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }
  res.json({ success: true, message: 'Team application deleted' });
});

// 6. Mentorship Session Booking
app.get('/api/mentorship/bookings', (req, res) => {
  const bookings = db.get('mentorship_bookings');
  res.json({ success: true, count: bookings.length, bookings });
});

app.post('/api/mentorship/book', (req, res) => {
  const { studentName, studentEmail, domain, preferredDate, message } = req.body;

  if (!studentName || !studentEmail || !domain) {
    return res.status(400).json({ success: false, error: 'Name, email, and mentorship domain are required.' });
  }

  const newBooking = {
    id: `ment-${Date.now()}`,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim().toLowerCase(),
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

app.patch('/api/mentorship/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.update('mentorship_bookings', (b) => b.id === id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  res.json({ success: true, message: `Status updated to ${status}`, booking: updated });
});

app.delete('/api/mentorship/bookings/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('mentorship_bookings', (b) => b.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  res.json({ success: true, message: 'Booking deleted' });
});

// 7. Contact Inquiries & Feedback
app.get('/api/contact', (req, res) => {
  const inquiries = db.get('contact_inquiries');
  res.json({ success: true, count: inquiries.length, inquiries });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, category, message, college } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
  }

  const inquiry = {
    id: `con-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    college: college ? college.trim() : '',
    subject: subject ? subject.trim() : 'General Inquiry',
    category: category || 'General',
    message: message.trim(),
    status: 'open',
    createdAt: new Date().toISOString()
  };

  db.insert('contact_inquiries', inquiry);

  res.status(201).json({
    success: true,
    message: 'Thanks! Your inquiry has been logged. We will get back to you shortly.',
    inquiry
  });
});

app.patch('/api/contact/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.update('contact_inquiries', (c) => c.id === id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Inquiry not found' });
  }
  res.json({ success: true, message: `Inquiry status updated to ${status}`, inquiry: updated });
});

app.delete('/api/contact/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.delete('contact_inquiries', (c) => c.id === id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Inquiry not found' });
  }
  res.json({ success: true, message: 'Inquiry deleted' });
});

// 8. Newsletter Subscription
app.get('/api/newsletter/subscribers', (req, res) => {
  const subscribers = db.get('subscribers');
  res.json({ success: true, count: subscribers.length, subscribers });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  const subscribers = db.get('subscribers');
  const cleanEmail = email.trim().toLowerCase();
  if (!subscribers.includes(cleanEmail)) {
    subscribers.push(cleanEmail);
    db.save();
  }

  res.status(201).json({
    success: true,
    message: 'Subscribed! You will receive our weekly student digest and opportunity alerts.'
  });
});

// Catch-all 404 for API Endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Catch-all 404 for Web Pages (Serves styled 404.html)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'), (err) => {
    if (err) {
      res.status(404).send('<h1>404 - Page Not Found</h1><p><a href="/">Return to UNIMATE Home</a></p>');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UNIMATE Server Error]:', err);
  if (req.path.startsWith('/api')) {
    res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  } else {
    res.status(500).send('<h1>500 - Server Error</h1><p>Something went wrong. <a href="/">Return Home</a></p>');
  }
});

// Start Server when run directly
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 UNIMATE Full-Stack Platform online!`);
    console.log(`👉 Local: http://localhost:${PORT}`);
    console.log(`👉 Network: http://${HOST}:${PORT}`);
    console.log(`👉 API Health: http://localhost:${PORT}/api/health`);
    console.log(`👉 Portal: http://localhost:${PORT}/portal`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
