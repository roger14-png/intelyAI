import { LegalShell } from '../../components/legal/LegalShell';
import { TrustCard } from '../../components/legal/TrustCard';

export default function CookiesPage() {
  return (
    <LegalShell eyebrow="Cookies" title="Cookies & Privacy" subtitle="Clear choices, transparent controls, and secure experiences">
      <div className="legal-section">
        <div className="trust-grid">
          <TrustCard title="Essential" description="Cookies required for core functionality and security." />
          <TrustCard title="Analytics" description="Cookies used to understand usage and improve the service." />
          <TrustCard title="Preferences" description="Cookies that remember your settings and choices." />
          <TrustCard title="Marketing (Optional)" description="Additional cookies only when enabled by consent." />
        </div>

        <section className="legal-block">
          <h2>Cookie Controls (MVP)</h2>
          <p>
            This page scaffolds cookie explanations and brand-consistent controls. Implement cookie preference storage and
            enforcement when backend support is ready.
          </p>
          <ul className="legal-bullets">
            <li>Accept All to enable all categories.</li>
            <li>Manage Preferences to enable/disable optional cookie categories.</li>
            <li>Reject Optional keeps essential cookies only.</li>
          </ul>
        </section>
      </div>
    </LegalShell>
  );
}

