import { useState } from 'react';


type AuthRole = 'candidate' | 'recruiter' | 'admin' | 'founder';
type AuthMode = 'login' | 'register';

export function AuthPage({
  loading,
  error,
  initialRole = 'candidate',
  initialMode = 'login',
  onAuthSuccess
}: {
  loading: boolean;
  error: string | null;
  initialRole?: AuthRole;
  initialMode?: AuthMode;
  onAuthSuccess?: () => void;
}) {

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [authRole, setAuthRole] = useState<AuthRole>(initialRole);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('recruiter@intelyhire.dev');
  const [password, setPassword] = useState('Passw0rd!');
  const [selectedRole, setSelectedRole] = useState<AuthRole>(authRole);

  // Auth submission is performed by App (it owns the mutations + token persistence).

  return (
    <div className="auth-shell">
      <AuthHero />

      <AuthCard
        role={authRole}
        mode={authMode}
        onModeChange={setAuthMode}
        onRoleChange={setAuthRole}
        onSubmit={() => {
          // Submission is handled in App via passed mutation callbacks.
        }}
        loading={loading}
        error={error}
        fields={{ fullName, email, password, selectedRole }}
        setFields={{ setFullName, setEmail, setPassword, setSelectedRole }}
      />
    </div>
  );
}

function AuthHero() {
  return (
    <section className="auth-hero">
      <p className="eyebrow">Recruitment operating system</p>
      <h1>Move from application to hire without losing the thread.</h1>
      <p>Candidate portal, recruiter portal, and admin visibility in one focused workspace.</p>
      <div className="hero-pill-group">
        <span>Role-based access</span>
        <span>Workflow tracking</span>
        <span>Dashboard-ready</span>
      </div>
    </section>
  );
}

function AuthCard({
  role,
  mode,
  onModeChange,
  onRoleChange,
  onSubmit,
  loading,
  error,
  fields,
  setFields
}: {
  role: AuthRole;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onRoleChange: (role: AuthRole) => void;
  onSubmit: (payload: {
    mode: AuthMode;
    fullName: string;
    email: string;
    password: string;
    role: AuthRole;
  }) => void;
  loading: boolean;
  error: string | null;
  fields: { fullName: string; email: string; password: string; selectedRole: AuthRole };
  setFields: {
    setFullName: (v: string) => void;
    setEmail: (v: string) => void;
    setPassword: (v: string) => void;
    setSelectedRole: (v: AuthRole) => void;
  };
}) {
  const { fullName, email, password, selectedRole } = fields;
  const { setFullName, setEmail, setPassword, setSelectedRole } = setFields;

  return (
    <section className="auth-card">
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => onModeChange('login')} type="button">
          Login
        </button>
        <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => onModeChange('register')} type="button">
          Register
        </button>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ mode, fullName, email, password, role: selectedRole });
        }}
      >
        {mode === 'register' ? (
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Taylor Candidate" />
          </label>
        ) : null}

        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
        </label>

        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
        </label>

        {mode === 'register' ? (
          <label>
            Role
            <select
              value={selectedRole}
              onChange={(event) => {
                const next = event.target.value as AuthRole;
                onRoleChange(next);
                setSelectedRole(next);
              }}
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
              <option value="founder">Founder</option>
            </select>
          </label>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="microcopy">Seeded recruiter, admin, and founder accounts all use the same password for fast demo access.</p>
      </form>
    </section>
  );
}

