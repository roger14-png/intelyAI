import { LegalShell } from '../../components/legal/LegalShell';

export default function CookiePreferencesPage() {
  return (
    <LegalShell
      eyebrow="Settings"
      title="Cookie Preferences"
      subtitle="Manage cookie categories and optional tracking preferences."
      showCookieBanner={false}
    >
      <div className="legal-section">
        <section className="settings-grid">
          <div className="settings-card">
            <div className="settings-card__title">Essential</div>
            <div className="settings-card__desc">Required for core functionality and security. Always enabled.</div>
            <button className="secondary-button" type="button" disabled>
              Enabled
            </button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Analytics</div>
            <div className="settings-card__desc">Help us improve the platform by understanding usage patterns.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: analytics preference not persisted yet.')}>Manage</button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Preferences</div>
            <div className="settings-card__desc">Remember your choices and improve experience.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: preferences preference not persisted yet.')}>Manage</button>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Optional</div>
            <div className="settings-card__desc">Enable optional cookies only when you consent.</div>
            <button className="secondary-button" type="button" onClick={() => alert('UI scaffold: optional cookies not persisted yet.')}>Manage</button>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

