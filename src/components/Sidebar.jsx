import React from 'react';

export const navigation = [
  ['overview', 'Overview'], ['courses', 'Course outcomes'],
  ['retention', 'Retention'], ['teaching', 'Teaching evaluation'],
  ['records', 'Records'],
];

function Icon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/></>,
    courses: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    retention: <><path d="M4 19h16M4 19V5M7 15l5-5 4 3 5-7M16 6h5v5"/></>,
    teaching: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>,
    records: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M10 9v11M14 13h3M14 16h3"/></>,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-11-3 3 3 3"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Sidebar({ page }) {
  return <header className="topnav">
    <a className="brand" href="#overview" aria-label="BSIT Insights overview" onClick={e => { e.preventDefault(); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}>
      <span className="monogram">BSIT</span>
      <span className="brand-copy">BSIT Insights<small>Batangas State University</small></span>
    </a>
    <nav id="sidebar-navigation" aria-label="Main navigation">
      {navigation.map(([id, label]) => <a key={id} href={'#' + id} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', '#' + id); }} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined}>
        <Icon name={id}/><span className="nav-text">{label}</span>
      </a>)}
    </nav>
  </header>;
}

export function ScrollTop({ page }) {
  const [state, setState] = React.useState({ show: false, canBack: false });
  React.useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;
    const fn = () => setState(s => { const show = el.scrollTop > 240; return s.show === show ? s : { ...s, show }; });
    fn();
    el.addEventListener('scroll', fn, { passive: true });
    return () => el.removeEventListener('scroll', fn);
  }, [page]);
  const up = () => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  return <button type="button" className={'scroll-top' + (state.show ? ' is-visible' : '')} onClick={up} aria-label="Back to top and navigation" title="Back to top" tabIndex={state.show ? 0 : -1}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    <span>Top</span>
  </button>;
}
