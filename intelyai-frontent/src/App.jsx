import React, { useState, useEffect } from 'react';
import HomePage from './components/home/HomePage';
import Navbar from './components/Navbar';
import CandidateDashboard, { getSkillMatchDetails } from './components/candidate/CandidateDashboard';
import ApplicationReviewCenter from './components/candidate/ApplicationReviewCenter';
import RecruiterDashboard from './components/recruiter/RecruiterDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AuthModal from './components/auth/AuthModal';

import mockDb from '../db.json';

// Helper: Convert file to Base64 Data URL for previewing
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Dynamically loads Mozilla PDF.js from CDN for accurate PDF text uncompression
const loadPdfJs = () => {
  return new Promise((resolve) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      resolve(window.pdfjsLib);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

// Extracts uncompressed, human-readable text from PDF / DOCX / TXT files
const extractTextFromPdfFile = async (file) => {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    try {
      return await file.text();
    } catch (e) {}
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await loadPdfJs();

    if (pdfjsLib) {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let lastY;
        let pageText = '';
        for (let item of textContent.items) {
          if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          }
          pageText += item.str + ' ';
          lastY = item.transform[5];
        }
        fullText += pageText + '\n';
      }

      if (fullText.trim().length > 20) {
        return fullText;
      }
    }
  } catch (err) {
    console.warn('PDF.js text extraction failed or skipped, using fallback:', err);
  }

  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  } catch (e) {
    return file.name;
  }
};

const CROSS_INDUSTRY_SKILL_BANK = [
  'Customer Service', 'Data Entry', 'Microsoft Office', 'Microsoft Excel', 'Microsoft Word', 'PowerPoint',
  'Communication', 'Time Management', 'Problem Solving', 'Teamwork', 'Leadership', 'Project Management',
  'Public Speaking', 'Event Planning', 'Office Administration', 'Human Resources', 'Recruitment', 'Onboarding',
  'Financial Analysis', 'QuickBooks', 'Bookkeeping', 'Accounting', 'Auditing', 'Payroll', 'Taxation', 'Tax Compliance',
  'Patient Care', 'Vital Signs', 'Triage', 'First Aid', 'CPR', 'EHR', 'Phlebotomy', 'Infection Control',
  'SEO', 'Digital Marketing', 'Content Creation', 'Copywriting', 'Social Media', 'Sales', 'Lead Generation', 'CRM', 'Salesforce', 'Negotiation',
  'AutoCAD', 'Quality Assurance', 'Safety Compliance', 'Site Inspection', 'Project Planning',
  'Graphic Design', 'Figma', 'UI/UX', 'Photoshop', 'Canva', 'Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
  'React', 'Node.js', 'SQL', 'PostgreSQL', 'MySQL', 'PHP', 'Laravel', 'C#', 'Java', 'C++', 'AWS', 'Docker', 'Git'
];

const extractSkillsDirectlyFromCv = async (file, currentJobs = []) => {
  const rawText = await extractTextFromPdfFile(file);
  const extractedSkillsSet = new Set();

  const skillSectionRegex = /(?:core\s+|key\s+|technical\s+|professional\s+|functional\s+)?(?:skills|competencies|expertise|proficiencies|qualifications|capabilities|strengths)\b/i;
  const stopSectionRegex = /(?:experience|employment|work\s+history|education|academic|projects|references|certifications)\b/i;

  const lines = rawText.split(/[\r\n]+/);
  let inSkillSection = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (skillSectionRegex.test(trimmed)) {
      inSkillSection = true;
      continue;
    }

    if (stopSectionRegex.test(trimmed) && inSkillSection) {
      inSkillSection = false;
    }

    if (inSkillSection) {
      const items = trimmed
        .replace(/^[●•\-\*–\d\.\)\s]+/, '')
        .split(/[,;•●|*–-]/);

      for (let phrase of items) {
        let cleanPhrase = phrase
          .trim()
          .replace(/^[●•\-\*–\s]+/, '')
          .replace(/\s+/g, ' ');

        const isGenericLabel = /^(programming|frameworks|web|databases|tools|soft\s+skills|core\s+technical|competencies)$/i.test(cleanPhrase);

        if (cleanPhrase.length >= 2 && cleanPhrase.length <= 40 && !isGenericLabel) {
          const formattedSkill = cleanPhrase.charAt(0).toUpperCase() + cleanPhrase.slice(1);
          extractedSkillsSet.add(formattedSkill);
        }
      }
    }
  }

  const allJobRequirements = Array.from(
    new Set(currentJobs.flatMap((job) => job.requiredSkills || []))
  );

  const checkKeywords = Array.from(new Set([...CROSS_INDUSTRY_SKILL_BANK, ...allJobRequirements]));

  for (let keyword of checkKeywords) {
    const lowerKeyword = keyword.toLowerCase();
    const lowerCvText = rawText.toLowerCase();

    const escaped = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s|\\/|,|\\(|\\)|;)${escaped}(?:$|\\s|\\/|,|\\(|\\)|;|\\.)`, 'i');

    if (regex.test(lowerCvText) || lowerCvText.includes(lowerKeyword)) {
      extractedSkillsSet.add(keyword);
    }
  }

  const verifiedSkills = Array.from(extractedSkillsSet);

  const missingSkills = allJobRequirements.filter(
    (reqSkill) => !verifiedSkills.some((s) => s.toLowerCase() === reqSkill.toLowerCase())
  );

  const careerScore = verifiedSkills.length === 0 
    ? 0 
    : Math.min(100, Math.round((verifiedSkills.length / Math.max(allJobRequirements.length, 4)) * 100));

  let readinessLevel = 'Needs CV Skills';
  if (careerScore >= 80) readinessLevel = 'Highly Competitive';
  else if (careerScore >= 50) readinessLevel = 'Job Ready';
  else if (careerScore > 0) readinessLevel = 'Developing';

  return {
    skills: verifiedSkills,
    missingSkills: missingSkills,
    careerScore: careerScore,
    readinessLevel: readinessLevel
  };
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const queryParams = new URLSearchParams(window.location.search);
  const initialRole = queryParams.get('role') || 'home';

  const [currentView, setCurrentView] = useState(initialRole);
  const [loading, setLoading] = useState(true);

  const initialProfile = mockDb.profile || mockDb.candidate_profiles?.[0];
  const [profile, setProfile] = useState(initialProfile);

  const [jobs, setJobs] = useState(mockDb.jobs || []);
  const [applications, setApplications] = useState(mockDb.applications || []);
  const [currentDraft, setCurrentDraft] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    async function fetchData() {
      try {
        const savedLocalProfile = localStorage.getItem('intelyhire_candidate_profile');
        if (savedLocalProfile) {
          setProfile(JSON.parse(savedLocalProfile));
        }

        const [profileRes, jobsRes, appsRes] = await Promise.all([
          fetch('http://localhost:5000/profile').catch(() => null),
          fetch('http://localhost:5000/jobs').catch(() => null),
          fetch('http://localhost:5000/applications').catch(() => null),
        ]);

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          const serverProfile = Array.isArray(profileData) ? profileData[0] : profileData;
          setProfile((prev) => ({ ...serverProfile, ...prev }));
        }
        if (jobsRes && jobsRes.ok) {
          setJobs(await jobsRes.json());
        }
        if (appsRes && appsRes.ok) {
          setApplications(await appsRes.json());
        }
      } catch (err) {
        console.warn('API server offline:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user, role) => {
    setCurrentUser(user);
    setIsAuthOpen(false);
    setCurrentView(role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  const handleUploadCv = async (file) => {
    if (!file) return;

    try {
      const cvDataUrl = await readFileAsDataUrl(file);
      const parsedData = await extractSkillsDirectlyFromCv(file, jobs);

      const updatedProfile = {
        ...profile,
        cvUrl: cvDataUrl,
        cvFileName: file.name,
        skills: parsedData.skills,
        missingSkills: parsedData.missingSkills,
        careerScore: parsedData.careerScore,
        readinessLevel: parsedData.readinessLevel
      };

      setProfile(updatedProfile);
      localStorage.setItem('intelyhire_candidate_profile', JSON.stringify(updatedProfile));

      const profileId = profile?.id || 'prof_1';
      fetch(`http://localhost:5000/candidate_profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      }).catch(() => {});

    } catch (err) {
      console.error('CV Upload & Parsing Error:', err);
    }
  };

  const handleDeleteCv = async () => {
    if (!window.confirm('Are you sure you want to delete your active CV and clear extracted skills?')) return;

    const clearedProfile = {
      ...profile,
      cvUrl: null,
      cvFileName: null,
      skills: [],
      missingSkills: [],
      careerScore: 0,
      readinessLevel: 'No CV Uploaded'
    };

    setProfile(clearedProfile);
    localStorage.setItem('intelyhire_candidate_profile', JSON.stringify(clearedProfile));

    const profileId = profile?.id || 'prof_1';
    fetch(`http://localhost:5000/candidate_profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearedProfile),
    }).catch(() => {});
  };

  // ✅ Dynamically calculates matchScore based on profile.skills vs job.requiredSkills
 const handleGenerateDraftFromJob = async (job) => {
  const { matchPercentage } = getSkillMatchDetails(job.requiredSkills, profile?.skills);
  const calculatedMatchScore = profile?.cvUrl ? matchPercentage : 0;

  let generatedDraft = {
    id: `draft_${Date.now()}`,
    candidateId: profile?.id || 'usr_101',
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.company,
    matchScore: job.matchPercentage ?? calculatedMatchScore,
    trustScore: job.trustScore || 98,
    emailSubject: `Application for ${job.title} - ${profile?.fullName || 'Candidate'}`,
    emailBody: `Dear ${job.company} Hiring Team,\n\nI am eager to apply for the ${job.title} position...`,
    coverLetter: `With my experience in ${(profile?.skills?.length ? profile.skills.slice(0, 4).join(', ') : 'my domain')}, I am a strong fit for ${job.company}...`,
    status: 'generated',
  };

  setCurrentDraft(generatedDraft);
  // Do NOT change currentView here if you want to use the modal in candidate view
};
  const handleSubmitApplication = async (approvedPackage) => {
    const newApp = {
      id: `app_${Date.now()}`,
      jobId: approvedPackage?.jobId || currentDraft?.jobId || 'job_101',
      jobTitle: approvedPackage?.title || approvedPackage?.jobTitle || currentDraft?.jobTitle || 'Application Role',
      companyName: approvedPackage?.companyName || currentDraft?.companyName || 'Target Company',
      status: 'applied',
      submittedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);
    setCurrentDraft(null);
    setCurrentView('candidate');

    alert('Application package successfully submitted!');
  };

  const handleDeleteDataRequest = () => {
    if (window.confirm('Are you sure you want to request complete removal of your CV vectors?')) {
      localStorage.removeItem('intelyhire_candidate_profile');
      alert('Data deletion request submitted.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bright-bg dark:bg-dark-bg text-slate-600 dark:text-slate-300">
        <p className="text-xs font-bold uppercase tracking-wider">Loading Platform...</p>
      </div>
    );
  }

  if (currentView === 'home') {
    return (
      <>
        <HomePage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          onNavigateToPortal={(role) => setCurrentView(role)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bright-bg dark:bg-dark-bg text-bright-text dark:text-dark-text transition-colors duration-200">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        hasDraft={!!currentDraft}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        mode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-bold text-slate-500 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors"
          >
            ← Back to Home Landing Page
          </button>
        </div>

        {currentView === 'candidate' && (
          <CandidateDashboard
            profile={profile}
            jobs={jobs}
            applications={applications}
            activeDraft={currentDraft}
            draft={currentDraft}
            onUploadCv={handleUploadCv}
            onDeleteCv={handleDeleteCv}
            onGenerateDraft={handleGenerateDraftFromJob}
            onSubmitApplication={handleSubmitApplication}
            onDeleteDataRequest={handleDeleteDataRequest}
          />
        )}

        {currentView === 'candidate-review' && (
          <ApplicationReviewCenter
            draft={currentDraft}
            onApprove={handleSubmitApplication}
            onReject={() => {
              setCurrentDraft(null);
              setCurrentView('candidate');
            }}
          />
        )}

        {currentView === 'recruiter' && (
          <RecruiterDashboard jobs={jobs} applications={applications} />
        )}

        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}