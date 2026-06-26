import { useState } from 'react';

export function CookieBanner() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookies & Privacy">
      <div className="cookie-banner__inner">
        <div className="cookie-banner__title">🍪 Cookies & Privacy</div>
        <div className="cookie-banner__text">
          IntelyHire uses cookies to improve your experience and platform security.
        </div>

        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-btn cookie-btn--accept"
            onClick={() => setOpen(false)}
          >
            Accept All
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn--manage"
            onClick={() => setOpen(false)}
          >
            Manage Preferences
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn--reject"
            onClick={() => setOpen(false)}
          >
            Reject Optional
          </button>
        </div>
      </div>

      <button className="cookie-banner__close" type="button" onClick={() => setOpen(false)} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

