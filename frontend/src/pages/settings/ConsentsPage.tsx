import { LegalShell } from '../../components/legal/LegalShell';
import { ConsentChecklist } from '../../components/legal/ConsentChecklist';

export default function ConsentsPage() {
  return (
    <LegalShell
      eyebrow="Settings"
      title="Privacy Consents"
      subtitle="Review and withdraw consent for AI-powered processing."
      showCookieBanner={false}
    >
      <div className="legal-section">
        <ConsentChecklist />

        <section className="legal-block">
          <h2>Revoke when you want</h2>
          <p>
            In the MVP UI, consent changes are not persisted yet. Backend persistence, audit logs, and consent
            enforcement will be added once the database modules are implemented.
          </p>
        </section>
      </div>
    </LegalShell>
  );
}

