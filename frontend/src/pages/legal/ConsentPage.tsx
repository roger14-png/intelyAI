import { LegalShell } from '../../components/legal/LegalShell';
import { ConsentChecklist } from '../../components/legal/ConsentChecklist';

export default function ConsentPage() {
  return (
    <LegalShell
      eyebrow="Consent"
      title="Consent Center"
      subtitle="Choose how IntelyHire uses your information."
    >
      <div className="legal-section">
        <ConsentChecklist />

        <section className="legal-block">
          <h2>AI does not make hiring decisions</h2>
          <p>
            IntelyHire’s automated assistance helps candidates and recruiters prepare and match more effectively.
            Final hiring decisions remain with employers and recruiters.
          </p>
        </section>
      </div>
    </LegalShell>
  );
}

