/*
 Minimal Express backend for local frontend integration.
 - Reads seed data from ../intelyai-frontent/db.json if present
 - Persists runtime changes to ./data/store.json
 - Exposes simple endpoints used by the frontend

 Usage:
  - cd backend
  - npm install
  - npm start

 Defaults to PORT=5000. See .env.example
*/

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const FRONTEND_DB_PATH = path.join(__dirname, '..', 'intelyai-frontent', 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadSeedData() {
  // If store exists, load it. Otherwise, try to seed from frontend db.json if available.
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to parse existing store.json, will reseed:', err.message);
    }
  }

  // Attempt to seed from frontend/db.json
  if (fs.existsSync(FRONTEND_DB_PATH)) {
    try {
      const raw = fs.readFileSync(FRONTEND_DB_PATH, 'utf-8');
      const data = JSON.parse(raw);
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
      console.log('Seeded store.json from intelyai-frontent/db.json');
      return data;
    } catch (err) {
      console.warn('Failed to seed from frontend db.json:', err.message);
    }
  }

  // Fall back to minimal defaults
  const empty = {
    profile: null,
    candidate_profiles: [],
    users: [],
    jobs: [],
    applications: [],
    interviews: []
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
  console.log('Initialized empty store.json');
  return empty;
}

let store = loadSeedData();

function persist() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to persist store.json:', err.message);
  }
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Profile (returns first candidate profile or profile field)
app.get('/profile', (req, res) => {
  if (store.profile) return res.json(store.profile);
  if (Array.isArray(store.candidate_profiles) && store.candidate_profiles.length > 0) {
    return res.json(store.candidate_profiles[0]);
  }
  res.json({});
});

// Candidate profiles
app.get('/candidate_profiles', (req, res) => {
  res.json(store.candidate_profiles || []);
});

app.patch('/candidate_profiles/:id', (req, res) => {
  const id = req.params.id;
  const idx = (store.candidate_profiles || []).findIndex(p => String(p.id) === String(id));
  if (idx === -1) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  const updated = { ...store.candidate_profiles[idx], ...req.body };
  store.candidate_profiles[idx] = updated;
  persist();
  res.json(updated);
});

// Users
app.get('/users', (req, res) => {
  const q = req.query.email;
  if (q) {
    const found = (store.users || []).filter(u => String(u.email || '').toLowerCase() === String(q).toLowerCase());
    return res.json(found);
  }
  res.json(store.users || []);
});

app.post('/users', (req, res) => {
  const user = req.body;
  store.users = store.users || [];
  store.users.push(user);
  persist();
  res.status(201).json(user);
});

// Jobs
app.get('/jobs', (req, res) => {
  res.json(store.jobs || []);
});

app.post('/jobs', (req, res) => {
  const job = req.body;
  store.jobs = store.jobs || [];
  store.jobs.unshift(job);
  persist();
  res.status(201).json(job);
});

app.patch('/jobs/:id', (req, res) => {
  const id = req.params.id;
  const idx = (store.jobs || []).findIndex(j => String(j.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });
  store.jobs[idx] = { ...store.jobs[idx], ...req.body };
  persist();
  res.json(store.jobs[idx]);
});

// Applications
app.get('/applications', (req, res) => {
  res.json(store.applications || []);
});

app.post('/applications', (req, res) => {
  const application = req.body;
  application.id = application.id || `app_${Date.now()}`;
  application.submittedAt = application.submittedAt || new Date().toISOString();
  store.applications = store.applications || [];
  store.applications.unshift(application);
  persist();
  res.status(201).json(application);
});

app.patch('/applications/:id', (req, res) => {
  const id = req.params.id;
  const idx = (store.applications || []).findIndex(a => String(a.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Application not found' });
  store.applications[idx] = { ...store.applications[idx], ...req.body };
  persist();
  res.json(store.applications[idx]);
});

// Interviews
app.get('/interviews', (req, res) => {
  res.json(store.interviews || []);
});

app.post('/interviews', (req, res) => {
  const interview = req.body;
  interview.id = interview.id || `int_${Date.now()}`;
  store.interviews = store.interviews || [];
  store.interviews.unshift(interview);
  persist();
  res.status(201).json(interview);
});

// Simple utility to reset store from frontend db.json (dev only)
app.post('/__seed_from_frontend', (req, res) => {
  try {
    if (!fs.existsSync(FRONTEND_DB_PATH)) return res.status(404).json({ message: 'frontend db.json not found' });
    const raw = fs.readFileSync(FRONTEND_DB_PATH, 'utf-8');
    store = JSON.parse(raw);
    persist();
    return res.json({ message: 'Seeded from frontend db.json' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to seed' });
  }
});

app.listen(PORT, () => {
  console.log(`IntelyAI local backend listening on http://localhost:${PORT}`);
});
