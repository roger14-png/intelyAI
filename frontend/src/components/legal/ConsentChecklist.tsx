export function ConsentChecklist() {
  return (
    <section className="consent-center">
      <div className="consent-center__header">
        <div className="consent-center__title">IntelyHire Consent Center</div>
        <div className="consent-center__sub">✓ Career Matching · ✓ Profile Analysis · ✓ Application Assistance</div>
      </div>

      <div className="consent-list" role="list">
        <label className="consent-item" role="listitem">
          <input type="checkbox" defaultChecked />
          <span>
            <strong>Career Matching</strong>
            <div className="consent-item__desc">Allow AI to recommend opportunities.</div>
          </span>
          <span className="consent-pill consent-pill--green">Enabled</span>
        </label>

        <label className="consent-item" role="listitem">
          <input type="checkbox" defaultChecked />
          <span>
            <strong>Profile Analysis</strong>
            <div className="consent-item__desc">Allow AI to calculate readiness scores.</div>
          </span>
          <span className="consent-pill consent-pill--green">Enabled</span>
        </label>

        <label className="consent-item" role="listitem">
          <input type="checkbox" defaultChecked />
          <span>
            <strong>Application Assistance</strong>
            <div className="consent-item__desc">Allow AI to generate tailored applications.</div>
          </span>
          <span className="consent-pill consent-pill--green">Enabled</span>
        </label>

        <div className="consent-optional" role="listitem">
          <div className="consent-optional__label">○ Research Participation (Optional)</div>
          <label className="consent-item consent-item--optional">
            <input type="checkbox" />
            <span>
              <strong>Improve Labour Market Insights</strong>
              <div className="consent-item__desc">Help us improve trends using aggregated insights.</div>
            </span>
            <span className="consent-pill consent-pill--blue">Optional</span>
          </label>
        </div>
      </div>

      <div className="consent-actions">
        <button type="button" className="primary-button">Save Consent</button>
        <button type="button" className="secondary-button">Manage Later</button>
      </div>

      <div className="consent-note">
        AI recommendations assist candidates and recruiters. Final hiring decisions remain with employers and recruiters.
      </div>
    </section>
  );
}

