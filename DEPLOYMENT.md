# 🚀 UNIMATE Platform - End-to-End Full-Stack Deployment Guide

Ye platform ab **100% full-stack end-to-end deployable** hai. Aap isse **Vercel, Render, Railway, Docker, ya self-hosted VPS** pe kisi bhi waqt deploy kar sakte hain.

---

## ⚡ Option 1: 1-Click Vercel Deployment (Recommended & Free)

UNIMATE already contains pre-configured `vercel.json` with serverless routing.

### Method A: Via GitHub (Sabse aasan)
1. Apne changes GitHub repository me push karein:
   ```bash
   git add .
   git commit -m "feat: complete end-to-end full stack architecture"
   git push origin main
   ```
2. [Vercel Dashboard](https://vercel.com/new) par jayein.
3. Apna GitHub repository (`vanshika2205/unimate`) select karein.
4. Framework Preset ko **Other** ya default rehne dein (Root Directory `./`).
5. **Deploy** button click karein!
6. Vercel kuch hi seconds me live URL generate kar dega (e.g. `https://unimate.vercel.app`).

### Method B: Via Vercel CLI (Terminal se direct)
```bash
npx vercel
```
Follow the prompts (hit Enter for defaults) -> Done!

---

## 🌐 Option 2: Render.com Deployment (Free Web Service)

Render automatically recognizes `render.yaml` present in the repository.

1. [dashboard.render.com](https://dashboard.render.com/) me login karein.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository: `vanshika2205/unimate`.
4. Render will auto-fill:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**. Aapka server live URL pe online ho jayega!

---

## 🚂 Option 3: Railway.app / Heroku

Because `Procfile` and `package.json` are pre-configured:
1. Connect your GitHub repo on [Railway.app](https://railway.app/).
2. Railway will auto-detect Node.js and run `Procfile` (`web: node server.js`).

---

## 🐳 Option 4: Docker Container Deployment

Production-ready Alpine Dockerfile is included.

### Build Image:
```bash
docker build -t unimate-platform .
```

### Run Container:
```bash
docker run -d -p 3000:3000 --name unimate-app unimate-platform
```

Access at: `http://localhost:3000`

---

## 💻 Local Development & Testing

### 1. Install Dependencies:
```bash
npm install
```

### 2. Run Automated Verification Tests:
```bash
npm test
```
*Executes all 18 end-to-end integration tests (Health, Applications, Notes, Community, Projects, Mentorship, Inquiries, Clean URLs).*

### 3. Start Development Server:
```bash
npm run dev
```

### 4. Start Production Server:
```bash
npm start
```

---

## 🛠 Platform Architecture Overview

| Component | Technology | Description |
|---|---|---|
| **Backend Server** | Node.js + Express 5 | High performance REST API with Morgan logging & Gzip compression |
| **Security** | Helmet + CORS | Configured CSP allowing Google Fonts and API integrations |
| **Database** | Persistent JSON DB (`data/db.js`) | Multi-environment resilience with auto-fallback for serverless (`/tmp`) |
| **Client Frontend** | Vanilla JS + Modern CSS | Zero external framework weight, lightning fast 99+ Lighthouse score |
| **Dashboard** | Master Operations Portal (`/portal`) | Real-time tracking of applications, notes, team requests, mentorship & APIs |

---

## 📡 Live REST API Endpoints

- `GET /api/health` - Platform uptime, memory & system counters
- `GET /api/internships` - Open student roles and prerequisites
- `POST /api/applications` - Student application submission (auto generates `APP-XXXX`)
- `GET /api/applications/track/:query` - Real-time tracking by APP-ID or Email
- `GET /api/notes` - Filterable academic notes and question banks library
- `POST /api/notes/:id/download` - Download counter increment
- `GET /api/community/posts` - Discussion threads with channel filter & search
- `POST /api/community/posts/:id/like` - Upvote / helpful counter
- `POST /api/community/posts/:id/reply` - Thread comment & peer discussion
- `GET /api/projects` - Collaborative projects & student team roster
- `POST /api/projects/:id/join` - Apply to join a project team
- `POST /api/mentorship/book` - 1-on-1 mentor guidance scheduling
- `POST /api/contact` - Student inquiries and moderator safety reports
- `POST /api/newsletter` - Weekly opportunity digest subscriber
- `GET /api/system/export` - Full database backup download
