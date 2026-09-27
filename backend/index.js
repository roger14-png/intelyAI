const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const os = require('os');

const PORT = Number(process.env.PORT || 5000);
const USE_CLUSTER = process.env.CLUSTER_MODE !== 'false';
const WORKER_COUNT = Number(process.env.WORKERS || 0);
const INSTANCE_ID = cluster.isWorker ? `worker-${cluster.worker.id}` : 'single-process';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  const DATA_DIR = path.join(__dirname, 'data');
  const STORE_PATH = path.join(DATA_DIR, 'store.json');
  const FRONTEND_DB_PATH = path.join(__dirname, '..', 'intelyai-frontent', 'db.json');
  const LOCK_PATH = `${STORE_PATH}.lock`;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  function loadSeedData() {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse existing store.json, will reseed:', err.message);
      }
    }

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

  function withStoreLock(task) {
    const start = Date.now();

    while (Date.now() - start < 5000) {
      try {
        const lockFd = fs.openSync(LOCK_PATH, 'wx');
        try {
          return task();
        } finally {
          fs.closeSync(lockFd);
          if (fs.existsSync(LOCK_PATH)) {
            fs.unlinkSync(LOCK_PATH);
          }
        }
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
      }
    }

    throw new Error('Timed out acquiring store lock');
  }

  function persist() {
    try {
      withStoreLock(() => {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
      });
    } catch (err) {
      console.error('Failed to persist store.json:', err.message);
    }
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      instanceId: INSTANCE_ID,
      pid: process.pid,
      timestamp: new Date().toISOString(),
      mode: USE_CLUSTER && cluster.isWorker ? 'cluster-worker' : 'single-process',
      port: PORT,
      uptimeSeconds: Math.round(process.uptime())
    });
  });

  app.get('/instance', (req, res) => {
    res.json({
      instanceId: INSTANCE_ID,
      pid: process.pid,
      clusterMode: USE_CLUSTER,
      port: PORT,
      workers: USE_CLUSTER ? WORKER_COUNT || Math.max(1, os.cpus().length - 1) : 1
    });
  });

  app.get('/profile', (req, res) => {
    if (store.profile) return res.json(store.profile);
    if (Array.isArray(store.candidate_profiles) && store.candidate_profiles.length > 0) {
      return res.json(store.candidate_profiles[0]);
    }
    res.json({});
  });

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

  return app;
}

if (USE_CLUSTER && cluster.isPrimary) {
  const targetWorkers = WORKER_COUNT > 0 ? WORKER_COUNT : Math.max(1, os.cpus().length - 1);
  console.log(`Starting IntelyAI in clustered mode with ${targetWorkers} workers on port ${PORT}`);

  for (let i = 0; i < targetWorkers; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    const reason = signal || code;
    console.warn(`Worker ${worker.process.pid} exited with ${reason}. Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  return;
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`IntelyAI backend listening on http://localhost:${PORT} :: instance=${INSTANCE_ID} :: pid=${process.pid}`);
});
