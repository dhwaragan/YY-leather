import React from 'react';
import './maintenance.css';

export const Maintenance: React.FC = () => {
  return (
    <div className="wrap">
      <div className="hero">
        <div className="illustration">
          <div className="illus-canvas" role="img" aria-label="Maintenance illustration">
            <svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" fill="none">
              <rect x="0" y="0" width="640" height="480" rx="12" fill="#fff" />
              <g transform="translate(60,40)">
                <circle cx="220" cy="140" r="110" fill="#fff3e0" />
                <path d="M160 200c20-40 80-40 100 0" stroke="#f97316" strokeWidth="10" strokeLinecap="round"/>
                <rect x="80" y="60" width="140" height="160" rx="14" fill="#fff" stroke="#fde68a" strokeWidth="6" />
                <path d="M200 60c40 20 60 60 48 100" stroke="#10b981" strokeWidth="10" strokeLinecap="round"/>
                <path d="M50 260c30-30 80-30 120 0" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round"/>
                <g transform="translate(340,80) scale(0.9)">
                  <path d="M0 60 L40 20 L60 40 L20 80 Z" fill="#fde68a" />
                  <path d="M10 50 L70 110" stroke="#f97316" strokeWidth="12" strokeLinecap="round" />
                </g>
              </g>
            </svg>
          </div>
        </div>
        <div className="content">
          <div className="mt-logo" style={{width:56,height:56,lineHeight:'56px',marginBottom:12}}>YY</div>
          <h1>WE'LL BE BACK SOON!</h1>
          <p className="mt-lead">We're doing some quick maintenance. Thanks for your patience — we'll be back online shortly.</p>
          <div className="mt-when">Maintenance window: 48 hours (starting now)</div>
          <div style={{marginTop:12}}>
            <a className="btn" href="#" onClick={(e) => e.preventDefault()}>Return to Homepage</a>
            <a className="btn secondary" href="mailto:hello@yyleathers.example" style={{marginLeft:12}}>Contact support</a>
          </div>
          <p className="note">Apologies — planned for 3 days earlier but reduced to 2 days. — YY Leathers</p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
