import { LegalShell } from '../../components/legal/LegalShell';
import { TrustCard } from '../../components/legal/TrustCard';

export default function TermsPage() {
  return (
    <LegalShell eyebrow="Terms of Service" title="Building Trusted Connections" subtitle="Between African Talent and Global Employers">
      <div className="legal-section">
        <div className="trust-grid">
          <TrustCard title="Trusted Use" description="Use IntelyHire responsibly and in line with the service’s purpose." />
          <TrustCard title="Account Responsibility" description="You are responsible for activity under your account." />
          <TrustCard title="Fair Matching" description="We support matching using transparent AI assistance, but hiring decisions remain with employers." />
          <TrustCard title="Security" description="We take reasonable steps to protect information and prevent unauthorized access." />
        </div>

        <section className="legal-block">
          <h2>Key Terms (MVP)</h2>
          <p>
            This MVP Terms page is a design and content scaffold. Replace these summaries with your final legal language
            for Kenya and applicable international requirements.
          </p>
          <ul className="legal-bullets">
            <li>Eligibility and account creation rules.</li>
            <li>Acceptable use and prohibited behaviors.</li>
            <li>Disclaimer: AI assistance does not replace human hiring judgment.</li>
            <li>Service availability and limitations.</li>
          </ul>
        </section>
      </div>
    </LegalShell>
  );
}

