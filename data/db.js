const fs = require('fs');
const path = require('path');

// Default Seed Data
const initialData = {
  internships: [
    {
      id: 'role-1',
      title: 'Core Contributor Intern',
      track: 'Engineering & Product',
      duration: '2 months',
      location: 'Remote / Online',
      type: 'Unpaid Internship',
      certificate: true,
      description: 'Work alongside lead student developers to build tools, review learning paths, and write technical guides.',
      requirements: ['Basic knowledge of HTML/CSS/JS or Python', 'Active university student', '5-8 hours/week commitment'],
      spots: 5,
      open: true
    },
    {
      id: 'role-2',
      title: 'Frontend Developer Intern',
      track: 'Web Development',
      duration: '3 months',
      location: 'Remote / Online',
      type: 'Unpaid Internship',
      certificate: true,
      description: 'Help develop responsive web components, UI polish, interactive tools and dashboards for the UNIMATE platform.',
      requirements: ['Comfortable with Modern JavaScript, CSS3, React or Vanilla DOM', 'Git & GitHub experience', 'Eye for detail and design'],
      spots: 3,
      open: true
    },
    {
      id: 'role-3',
      title: 'Campus Ambassador & Community Lead',
      track: 'Community & Growth',
      duration: 'Semester-long (4 months)',
      location: 'On-Campus / Hybrid',
      type: 'Leadership Role',
      certificate: true,
      description: 'Be the voice of UNIMATE in your university. Organize peer study sessions, share curated resources, and lead hack teams.',
      requirements: ['Enthusiastic about peer learning and tech communities', 'Good communication & networking skills', 'Active in university clubs'],
      spots: 10,
      open: true
    },
    {
      id: 'role-4',
      title: 'Academic Content & Notes Curator',
      track: 'Academic Support',
      duration: '2 months',
      location: 'Remote',
      type: 'Volunteer / Contributor',
      certificate: true,
      description: 'Review and verify engineering syllabus notes, organize past exam questions, and curate high-yield viva guides.',
      requirements: ['Consistent academic record', 'Strong clarity in technical concepts', 'Proficiency in LaTeX, Markdown, or Notion'],
      spots: 6,
      open: true
    }
  ],
  applications: [
    {
      id: 'APP-1021',
      roleId: 'role-1',
      roleTitle: 'Core Contributor Intern',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.edu',
      phone: '+91 98765 43210',
      university: 'Delhi Technological University',
      branch: 'Computer Science & Engineering',
      year: '3rd Year',
      github: 'https://github.com/aaravsharma',
      linkedin: 'https://linkedin.com/in/aaravsharma',
      sop: 'I am passionate about building open educational resources and have built 2 full-stack web applications.',
      status: 'under_review',
      submittedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'APP-1022',
      roleId: 'role-2',
      roleTitle: 'Frontend Developer Intern',
      fullName: 'Rhea Sen',
      email: 'rhea.sen@example.edu',
      phone: '+91 91234 56789',
      university: 'VIT Vellore',
      branch: 'Information Technology',
      year: '2nd Year',
      github: 'https://github.com/rheasen',
      linkedin: 'https://linkedin.com/in/rheasen',
      sop: 'Love creating smooth UI animations and responsive web portals with CSS and React.',
      status: 'accepted',
      submittedAt: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Data Structures & Algorithms Comprehensive Guide',
      subject: 'Data Structures',
      branch: 'Computer Science',
      semester: 3,
      type: 'Notes',
      author: 'Prof. K. Verma & UNIMATE Leads',
      downloads: 412,
      fileSize: '4.2 MB',
      tags: ['Trees', 'Graphs', 'Dynamic Programming', 'Complexity'],
      downloadUrl: '#',
      verified: true
    },
    {
      id: 'note-2',
      title: 'Operating Systems - Process Scheduling & Memory Management',
      subject: 'Operating Systems',
      branch: 'Computer Science',
      semester: 4,
      type: 'Notes',
      author: 'Ananya Roy (Top Contributor)',
      downloads: 320,
      fileSize: '3.1 MB',
      tags: ['Deadlocks', 'Virtual Memory', 'Semaphores', 'Linux Threads'],
      downloadUrl: '#',
      verified: true
    },
    {
      id: 'note-3',
      title: 'Digital Signal Processing - Lab Manual & Viva Voce',
      subject: 'Signal Processing',
      branch: 'Electronics & Comm.',
      semester: 5,
      type: 'Lab Manual',
      author: 'ECE Study Circle',
      downloads: 185,
      fileSize: '5.8 MB',
      tags: ['FFT', 'Butterworth Filter', 'MATLAB Code', 'Viva Q&A'],
      downloadUrl: '#',
      verified: true
    },
    {
      id: 'note-4',
      title: 'Database Management Systems - SQL & Normalization Cheatsheet',
      subject: 'DBMS',
      branch: 'Information Technology',
      semester: 4,
      type: 'Formula Sheet',
      author: 'UNIMATE Tech Team',
      downloads: 540,
      fileSize: '1.9 MB',
      tags: ['BCNF', '3NF', 'Transactions', 'ACID Properties'],
      downloadUrl: '#',
      verified: true
    },
    {
      id: 'note-5',
      title: 'Computer Networks - End-Term Question Bank with Solutions',
      subject: 'Computer Networks',
      branch: 'Computer Science',
      semester: 5,
      type: 'Question Bank',
      author: 'Peer Review Committee',
      downloads: 620,
      fileSize: '6.4 MB',
      tags: ['TCP/IP', 'OSI Model', 'Routing Protocols', 'Subnetting'],
      downloadUrl: '#',
      verified: true
    }
  ],
  community_posts: [
    {
      id: 'post-1',
      authorName: 'Kabir Patel',
      authorRole: '3rd Year CS • DTU',
      avatarColor: '#1d68f5',
      channel: 'web-dev',
      title: 'How should a 2nd year student balance DSA with full-stack project building?',
      content: 'I find myself spending 4 hours doing LeetCode and then having zero energy left for my React/Node project. How are you guys planning your weekly split?',
      likes: 24,
      likedBy: [],
      tags: ['CareerAdvice', 'DSA', 'WebDev', 'TimeManagement'],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      replies: [
        {
          id: 'rep-1',
          authorName: 'Pooja Iyer',
          authorRole: '4th Year IT',
          content: 'Dedicate weekdays (1.5 hrs/day) purely to DSA consistency, and keep Saturday/Sunday exclusively for uninterrupted project sprints. It prevents context switching burnout!',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ]
    },
    {
      id: 'post-2',
      authorName: 'Sneha Deshmukh',
      authorRole: '2nd Year ECE • Pune',
      avatarColor: '#059669',
      channel: 'hackathons',
      title: 'Looking for 2 teammates for Smart India Hackathon (SIH) Web/AI Track',
      content: 'We already have 1 backend engineer and 1 designer. Looking for someone strong in ML/Python API integrations or React frontend. Drop a comment if interested!',
      likes: 18,
      likedBy: [],
      tags: ['SIH2026', 'TeamUp', 'AI', 'FullStack'],
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      replies: [
        {
          id: 'rep-2',
          authorName: 'Devansh Joshi',
          authorRole: '3rd Year AIML',
          content: 'Hey Sneha! I have experience with FastAPI and LangChain pipelines. Just messaged you on GitHub!',
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
        }
      ]
    },
    {
      id: 'post-3',
      authorName: 'Manish Verma',
      authorRole: 'UNIMATE Mentor',
      avatarColor: '#7c3aed',
      channel: 'academic-doubts',
      title: 'Mastering OS Virtual Memory: Free visual breakdown & viva cheat notes',
      content: 'Page fault handling, TLB hit/miss penalty, and inverted page tables are the 3 most common viva questions in 4th sem OS exams. Curated a 2-page visual summary here!',
      likes: 47,
      likedBy: [],
      tags: ['OperatingSystems', 'VivaPrep', 'StudyNotes'],
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      replies: []
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Campus Resource Finder',
      category: 'Web App',
      difficulty: 'Beginner to Intermediate',
      summary: 'Make university study materials, lab records and question banks discoverable with instant branch/semester filtering and peer ratings.',
      techStack: ['HTML/CSS', 'JavaScript', 'Node.js/Express', 'REST APIs'],
      deliverables: 'Searchable UI, dynamic filters, upload brief modal, responsive layout.',
      teamMembers: 2,
      maxTeamMembers: 4,
      status: 'Open for Teammates'
    },
    {
      id: 'proj-2',
      title: 'Real-Time Doubt Clearance Portal',
      category: 'Full Stack',
      difficulty: 'Intermediate',
      summary: 'A minimalist collaborative board where students ask questions, tag subject mentors, and vote on verified step-by-step solutions.',
      techStack: ['React', 'Node.js', 'WebSockets', 'SQLite/Postgres'],
      deliverables: 'Live message threads, code syntax highlighter, upvote system, role badges.',
      teamMembers: 3,
      maxTeamMembers: 4,
      status: 'Open for Teammates'
    },
    {
      id: 'proj-3',
      title: 'AI Lecture Notes Summarizer & Flashcards',
      category: 'AI & Data',
      difficulty: 'Intermediate to Advanced',
      summary: 'Transform long lecture PDF notes into concise key-takeaway summaries, formula flashcards, and practice quiz questions.',
      techStack: ['Python', 'FastAPI', 'Gemini API / LLM', 'Vanilla JS'],
      deliverables: 'PDF parser, prompt pipeline, interactive flashcard carousel, export to Notion.',
      teamMembers: 1,
      maxTeamMembers: 3,
      status: 'Open for Teammates'
    }
  ],
  project_applications: [],
  mentorship_bookings: [
    {
      id: 'ment-1',
      mentorName: 'Vikramaditya (Senior SWE)',
      studentName: 'Tanya Gupta',
      studentEmail: 'tanya.g@college.edu',
      domain: 'Full Stack Web Development & Resume Review',
      date: '2026-10-22',
      status: 'Confirmed'
    }
  ],
  contact_inquiries: [
    {
      id: 'con-1',
      name: 'Rohan Mehra',
      email: 'rohan.mehra@gmail.com',
      subject: 'University Chapter Partnership',
      category: 'Partnership',
      message: 'We want to establish a recognized UNIMATE peer learning chapter at our campus in Chandigarh.',
      createdAt: new Date().toISOString()
    }
  ],
  subscribers: ['student1@university.edu', 'campus.tech@college.edu']
};

// Cloud-resilient storage path resolver
function resolveDbPath() {
  if (process.env.DB_FILE_PATH) {
    return process.env.DB_FILE_PATH;
  }
  const defaultPath = path.join(__dirname, 'database.json');
  // Check if current directory is writable (Vercel / read-only serverless check)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', 'unimate_database.json');
    if (!fs.existsSync(tmpPath) && fs.existsSync(defaultPath)) {
      try {
        fs.copyFileSync(defaultPath, tmpPath);
      } catch (e) {
        // Ignored
      }
    }
    return tmpPath;
  }
  return defaultPath;
}

const DB_FILE = resolveDbPath();

class Database {
  constructor() {
    this.filePath = DB_FILE;
    this.inMemoryOnly = false;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        for (const key of Object.keys(initialData)) {
          if (!parsed[key]) parsed[key] = JSON.parse(JSON.stringify(initialData[key]));
        }
        return parsed;
      }
    } catch (err) {
      console.warn(`[UNIMATE DB] Could not read from ${this.filePath}, falling back to default seed:`, err.message);
    }

    // Try fallback to /tmp if primary path failed
    if (this.filePath !== path.join('/tmp', 'unimate_database.json')) {
      try {
        const tmpPath = path.join('/tmp', 'unimate_database.json');
        if (fs.existsSync(tmpPath)) {
          const raw = fs.readFileSync(tmpPath, 'utf-8');
          this.filePath = tmpPath;
          return JSON.parse(raw);
        }
      } catch (e) {
        // Ignored
      }
    }

    const defaultClone = JSON.parse(JSON.stringify(initialData));
    this.save(defaultClone);
    return defaultClone;
  }

  save(dataToSave) {
    if (this.inMemoryOnly) return;
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[UNIMATE DB] Write to ${this.filePath} failed. Trying /tmp fallback...`, err.message);
      try {
        const tmpPath = path.join('/tmp', 'unimate_database.json');
        this.filePath = tmpPath;
        fs.writeFileSync(this.filePath, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
      } catch (tmpErr) {
        console.warn(`[UNIMATE DB] Disk write unavailable, operating in in-memory mode:`, tmpErr.message);
        this.inMemoryOnly = true;
      }
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  getById(collection, id) {
    return (this.data[collection] || []).find(item => item.id === id) || null;
  }

  count(collection) {
    return (this.data[collection] || []).length;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].unshift(item);
    this.save();
    return item;
  }

  update(collection, predicate, updates) {
    const items = this.data[collection] || [];
    const index = items.findIndex(predicate);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, predicate) {
    if (!this.data[collection]) return false;
    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((item) => !predicate(item));
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  exportAll() {
    return JSON.parse(JSON.stringify(this.data));
  }

  resetDefault() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
    return this.data;
  }
}

const db = new Database();

module.exports = db;

