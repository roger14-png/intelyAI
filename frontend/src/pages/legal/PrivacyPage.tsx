import { LegalShell } from '../../components/legal/LegalShell';
import { TrustCard } from '../../components/legal/TrustCard';

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacy & Data Protection"
      title="Your privacy matters"
      subtitle="IntelyHire is committed to protecting your personal information while helping connect African talent to global opportunities."
    >
      <div className="legal-section">
        <div className="trust-grid">
          <TrustCard
            title="Your Data"
            description="We collect and process information that is necessary to provide recruitment services, career insights, and job matching."
          />
          <TrustCard
            title="AI Transparency"
            description="AI supports scoring and content assistance. It does not make hiring decisions."
          />
          <TrustCard
            title="Secure Storage"
            description="We use industry-standard controls to help protect data from unauthorized access."
          />
          <TrustCard
            title="Global Privacy"
            description="We aim to safeguard personal data during transfers, and we respect applicable privacy standards."
          />
        </div>

        <section className="legal-block">
          <h2>How IntelyHire Uses Artificial Intelligence</h2>
          <p>
            IntelyHire uses AI to analyze professional profiles, assess career readiness, match candidates with opportunities, and
            assist with application materials.
          </p>
          <p>
            AI recommendations assist candidates and recruiters. AI does not make hiring decisions. Final hiring decisions remain with
            employers and recruiters.
          </p>
        </section>

        <section className="legal-block">
          <h2>Your Rights</h2>
          <div className="rights-grid">
            <div className="rights-card">
              <div className="rights-card__title">Access Your Data</div>
              <div className="rights-card__desc">Download your information anytime.</div>
            </div>
            <div className="rights-card">
              <div className="rights-card__title">Correct Your Data</div>
              <div className="rights-card__desc">Update inaccurate information.</div>
            </div>
            <div className="rights-card">
              <div className="rights-card__title">Delete Your Data</div>
              <div className="rights-card__desc">Request account deletion.</div>
            </div>
            <div className="rights-card">
              <div className="rights-card__title">Withdraw Consent</div>
              <div className="rights-card__desc">Control how your information is used.</div>
            </div>
          </div>
        </section>

        <section className="legal-block">
          <h2>Powered by Kenyan Data Protection Standards</h2>
          <p>
            This Trust Center language is designed to reflect Kenya’s Data Protection Act 2019 and privacy expectations for transparent
            processing.
          </p>
        </section>
      </div>
    </LegalShell>
  );
}

