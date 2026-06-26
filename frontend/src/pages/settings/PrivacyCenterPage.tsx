import { LegalShell } from '../../components/legal/LegalShell';

export default function PrivacyCenterPage() {
  return (
    <LegalShell
      eyebrow="Settings"
      title="Trust & Privacy Center"
      subtitle="Download data, correct records, withdraw consents, and manage privacy preferences."
      showCookieBanner={false}
    >
      <div className="legal-section">
        <section className="settings-grid">
          <div className="settings-card">
            <div className="settings-card__title">Download My Data</div>
            <div className="settings-card__desc">Export a copy of your profile, applications, and consents.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: export not connected yet.')}>Export Data</button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Request Data Correction</div>
            <div className="settings-card__desc">Update inaccurate personal information.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: correction flow not connected yet.')}>Request Correction</button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Delete My Account</div>
            <div className="settings-card__desc">Request deletion subject to legal and operational obligations.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: delete flow not connected yet.')}>Delete Account</button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Withdraw Consents</div>
            <div className="settings-card__desc">Revoke permissions for specific AI-powered processing.</div>
            <button className="secondary-button" type="button" onClick={() => (window.location.pathname = '/settings/consents')}>Manage Consents</button>
          </div>
        </section>

        <section className="legal-block">
          <h2>How we respond</h2>
          <p>
            Requests are handled with care and within reasonable timeframes. In the MVP, these buttons are scaffolds
            until backend records and audit logs are implemented.
          </p>
        </section>
      </div>
    </LegalShell>
  );
}

