import { useMemo } from 'react';
import logo from '../assets/logos/intelyhire-logo.jpg';

export function LandingPage() {
  const stats = useMemo(
    () => [
      { label: 'Career Readiness Score', value: '89%' },
      { label: 'Applications Sent', value: '14' },
      { label: 'Interviews Scheduled', value: '3' },
      { label: 'Recruiter Responses', value: '8' }
    ],
    []
  );

  return (
    <div className="landing">
      <header className="landing-nav">
          <div className="landing-nav__left">

          <div className="landing-logo" aria-hidden="true">
            <img className="landing-logo__img" src={logo} alt="IntelyHire logo" />
          </div>
          <span className="brand-name">IntelyHire</span>
        </div>

        <nav className="landing-nav__right">
          <a className="nav-link" href="#signin">
            Sign In
          </a>
          <a className="nav-link nav-link--cta" href="#join">
            Join
          </a>
        </nav>
      </header>

      <section className="landing-hero" id="top">
        <div className="container landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="eyebrow">AI Career Intelligence Platform</div>
            <h1 className="landing-h1">AI-Powered Career Intelligence for Africa's Global Workforce</h1>

            <p className="landing-sub">
              Upload your profile once. IntelyHire finds opportunities, matches you intelligently, prepares applications,
              tracks recruiter responses, and helps you grow your career.
            </p>

            <div className="landing-hero__actions">
              <a className="primary-button" href="/auth" role="button" aria-label="Get started free">
                Get Started Free
              </a>

              <a className="secondary-button landing-video" href="#demo" aria-label="Watch demo">
                Watch Demo
              </a>
            </div>

            <div className="landing-metrics">
              <div className="metric">1000+ Jobs Daily</div>
              <div className="metric">500+ Recruiters</div>
              <div className="metric">AI-Powered Matching</div>
            </div>
          </div>

          <div className="landing-hero__visual">
            <div className="dashboard-mockup" aria-label="Candidate dashboard preview">
              <div className="dashboard-mockup__header">
                <div className="dashboard-mockup__title">
                  <span className="dot dot--blue" />
                  Career Intelligence Dashboard
                </div>
                <div className="dashboard-mockup__pill">Updated just now</div>
              </div>

              <div className="dashboard-mockup__grid">
                <div className="dashboard-card dashboard-card--score">
                  <div className="dashboard-card__label">Career Readiness Score</div>
                  <div className="dashboard-card__value">{stats[0].value}</div>
                </div>

                <div className="dashboard-card">
                  <div className="dashboard-card__label">Top Match</div>
                  <div className="dashboard-card__value dashboard-card__value--small">Senior Full Stack Developer</div>
                  <div className="dashboard-card__sub">Match Score: 96%</div>
                </div>

                <div className="dashboard-card dashboard-card--thin">
                  <div className="dashboard-card__label">Applications Sent</div>
                  <div className="dashboard-card__value">14</div>
                </div>

                <div className="dashboard-card dashboard-card--thin">
                  <div className="dashboard-card__label">Interviews Scheduled</div>
                  <div className="dashboard-card__value">3</div>
                </div>

                <div className="dashboard-card dashboard-card--thin">
                  <div className="dashboard-card__label">Recruiter Responses</div>
                  <div className="dashboard-card__value">8</div>
                </div>
              </div>

              <div className="dashboard-mockup__footer">
                <div className="mini-bar">
                  <div className="mini-bar__label">Growth</div>
                  <div className="mini-bar__track" aria-hidden="true">
                    <div className="mini-bar__fill" style={{ width: '72%' }} />
                  </div>
                </div>
                <div className="mini-pill">AI Assist</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--dark">
        <div className="container">
          <h2 className="landing-h2">Finding Great Jobs Shouldn't Be a Full-Time Job</h2>
          <div className="feature-list">
            {[
              'Hours spent searching',
              'Repetitive applications',
              'Missed opportunities',
              'Generic resumes',
              'No feedback from recruiters'
            ].map((item) => (
              <div className="feature-list__item" key={item}>
                <span className="check" aria-hidden="true">
                  ✕
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <h2 className="landing-h2">Meet Your AI Career Partner</h2>

          <div className="feature-grid">
            <FeatureCard
              title="AI Career Intelligence"
              points={['Analyze skills and experience', 'Generate readiness scores', 'Identify career gaps']}
            />
            <FeatureCard
              title="AI Job Intelligence"
              points={['Verify opportunities', 'Detect scams', 'Prioritize quality jobs']}
            />
            <FeatureCard
              title="Smart Matching"
              points={['Find best-fit opportunities', 'Suitability scoring', 'Personalized recommendations']}
            />
            <FeatureCard
              title="Application Engine"
              points={['Tailored resumes', 'AI cover letters', 'One-click applications']}
            />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted" id="how-it-works">
        <div className="container">
          <h2 className="landing-h2">From Profile To Placement</h2>

          <ol className="timeline">
            {[
              'Create Profile',
              'AI Analyzes Experience',
              'Discover Opportunities',
              'Generate Applications',
              'Recruiters Respond',
              'Grow Your Career'
            ].map((step, idx) => (
              <li className="timeline__step" key={step}>
                <div className="timeline__index">{idx + 1}</div>
                <div className="timeline__content">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <h2 className="landing-h2">African Talent. Global Reach.</h2>
          <div className="global-list">
            {['United States', 'Canada', 'UK', 'Germany', 'Netherlands', 'UAE', 'Australia'].map((c) => (
              <div className="global-pill" key={c}>
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--dark">
        <div className="container">
          <h2 className="landing-h2">AI Assists. Humans Decide.</h2>
          <p className="landing-lead">
            IntelyHire uses AI to recommend opportunities and improve applications. Recruiters and employers always make
            final hiring decisions.
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <h2 className="landing-h2">Trust Built In</h2>
          <div className="trust-grid">
            <TrustItem title="Privacy First" desc="Secure, consent-based matching to protect your identity and data." />
            <TrustItem title="Secure Data Handling" desc="Encryption and safe storage for profile information." />
            <TrustItem title="Consent-Based Matching" desc="You control what gets used and when." />
            <TrustItem title="Kenya Data Protection Act Compliant" desc="Designed to align with Kenyan privacy requirements." />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted" id="pricing">
        <div className="container">
          <h2 className="landing-h2">Pricing</h2>
          <div className="pricing-grid">
            <PricingCard
              name="Free"
              price="$0"
              desc="Start building your career profile."
              items={['Career Profile', 'Basic Matching', 'Application Tracking']}
              cta="Create Free Profile"
              variant="basic"
            />
            <PricingCard
              name="Professional"
              price="$19"
              desc="More matching intelligence and faster iteration."
              items={['Advanced AI Matching', 'Resume Optimization', 'Priority Opportunities']}
              cta="Upgrade to Pro"
              variant="pro"
            />
            <PricingCard
              name="Premium"
              price="$39"
              desc="AI career coach + unlimited applications."
              items={['AI Career Coach', 'Unlimited Applications', 'Premium Support']}
              cta="Go Premium"
              variant="premium"
            />
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="container landing-cta__inner">
          <div>
            <h2 className="landing-cta__h2">Ready To Accelerate Your Career?</h2>
            <p className="landing-cta__p">Join IntelyHire Today</p>
          </div>
          <div className="landing-cta__actions">
            <button className="primary-button primary-button--big" type="button">
              Create Free Profile
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <div className="footer-brand">IntelyHire</div>
          <div className="footer-links">
            <a className="footer-link" href="/legal/privacy">
              Privacy
            </a>
            <a className="footer-link" href="/legal/terms">
              Terms
            </a>
            <a className="footer-link" href="/settings/privacy-center">
              Cookie Settings
            </a>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} IntelyHire</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="feature-card">
      <div className="feature-card__title">{title}</div>
      <ul className="feature-card__list">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function TrustItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="trust-item">
      <div className="trust-item__title">{title}</div>
      <div className="trust-item__desc">{desc}</div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  desc,
  items,
  cta,
  variant
}: {
  name: string;
  price: string;
  desc: string;
  items: string[];
  cta: string;
  variant: 'basic' | 'pro' | 'premium';
}) {
  return (
    <div className={`pricing-card pricing-card--${variant}`}>
      <div className="pricing-card__name">{name}</div>
      <div className="pricing-card__price">{price}</div>
      <div className="pricing-card__desc">{desc}</div>
      <ul className="pricing-card__list">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <button className="primary-button" type="button">
        {cta}
      </button>
    </div>
  );
}

