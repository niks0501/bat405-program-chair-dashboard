import React from 'react';

export const navigation = [
  ['overview', 'Overview'], ['courses', 'Course outcomes'],
  ['retention', 'Retention'], ['teaching', 'Teaching evaluation'],
  ['records', 'Records'], ['notes', 'Data notes'],
];

function Icon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/></>,
    courses: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    retention: <><path d="M4 19h16M4 19V5M7 15l5-5 4 3 5-7M16 6h5v5"/></>,
    teaching: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>,
    records: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M10 9v11M14 13h3M14 16h3"/></>,
    notes: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-11-3 3 3 3"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Sidebar({ page }) {
  return <aside className="sidebar hover-sidebar">
    <div className="sidebar-heading">
      <a className="brand" href="#overview" aria-label="BSIT Insights overview">
        <span className="monogram">BSIT</span>
        <span className="brand-copy">BSIT Insights<small>Batangas State University</small></span>
      </a>

    </div>
    <nav id="sidebar-navigation" aria-label="Main navigation">
      <div className="nav-group nav-group-single">
        {navigation.map(([id, label]) => <a key={id} href={'#' + id} className={page === id ? 'active' : ''} aria-label={label} aria-current={page === id ? 'page' : undefined}>
          <Icon name={id}/><span className="nav-text">{label}</span><span className="nav-tooltip" aria-hidden="true">{label}</span>
        </a>)}
      </div>
    </nav>
    <div className="sidebar-footer"><span className="footer-symbol"><Icon name="overview"/></span><div className="footer-copy"><strong>BSIT Program Dashboard</strong><small>Illustrative aggregates only</small></div></div>
  </aside>;
}
