import type React from 'react';
import { CookieBanner } from './CookieBanner';
import logo from '../../assets/logos/intelyhire-logo.jpg';

export function LegalShell({
  eyebrow,
  title,
  subtitle,
  children,
  showCookieBanner = true
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCookieBanner?: boolean;
}) {
  return (
    <div className="legal-shell">
      <section className="legal-hero">
        <div className="legal-hero__content">
          <div className="legal-logo-badge" aria-hidden="true">
            <img className="legal-logo-badge__img" src={logo} alt="IntelyHire logo" />
          </div>
          <div>
            <p className="legal-eyebrow">{eyebrow}</p>
            <h1 className="legal-h1">{title}</h1>
            {subtitle ? <p className="legal-subtitle">{subtitle}</p> : null}
            <div className="legal-tagline">
              <span>IntelyHire Trust Center</span>
            </div>
          </div>
        </div>

        <div className="legal-hero__accent" aria-hidden="true" />
      </section>

      <main className="legal-main">{children}</main>

      {showCookieBanner ? <CookieBanner /> : null}

      <footer className="legal-footer">
        <div className="legal-footer__card">
          <div className="legal-footer__title">Questions About Privacy?</div>
          <div className="legal-footer__email">privacy@intelyhire.com</div>
          <div className="legal-footer__meta">
            <div>
              <strong>Data Protection Officer</strong>
            </div>
            <div>Response Time: Within 30 Days</div>
          </div>
          <div className="legal-footer__compliant">
            <div className="legal-footer__compliant-label">Compliant with:</div>
            <div className="legal-checks">
              <div className="legal-check">✓ Kenya Data Protection Act 2019</div>
              <div className="legal-check">✓ International Data Transfer Standards</div>
              <div className="legal-check">✓ AI Transparency Principles</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

