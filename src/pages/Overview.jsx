import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, Chart, Metrics, Status } from '../components/UI.jsx';
import { dataset, percent, matchesStatus, terms } from '../data.js';

export default function Overview({ data, onSelect, onTerm, cohort, dept, status, compare, focus, setFocus }) {
  const overviewRef = useRef(null);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (!expanded) return; const onKey = e => { if (e.key === 'Escape') setExpanded(null); }; addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey); }, [expanded]);
  useEffect(() => {
    const panels = overviewRef.current?.querySelectorAll('.overview-review-card') || [];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.dataset.motion = 'visible';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    panels.forEach(panel => {
      panel.dataset.motion = 'pending';
      panel.querySelectorAll('.review-item').forEach((row, index) => row.style.setProperty('--row-delay', `${index * 40}ms`));
      observer.observe(panel);
    });
    return () => {
      observer.disconnect();
      panels.forEach(panel => delete panel.dataset.motion);
    };
  }, []);
  const snapshots = Array.from({ length: 6 }, (_, i) => dataset(String(2023 + Math.floor(i / 2)), String(i % 2 + 1), cohort, dept));
  const previous = snapshots[data.term - 1];
  const metrics = data.metrics.filter(m => matchesStatus(m.value, m.target, status));
  const courses = [...data.rows].sort((a, b) => a.passed / a.attempts - b.passed / b.attempts);
  const below = courses.filter(r => r.passed / r.attempts * 100 < 85);
  const attention = [
    ...(below.length ? [{ key: 'pass', title: 'Course outcomes', body: `${below.length} courses below target. ${below[0].code} has the lowest pass rate.`, value: below[0].passed / below[0].attempts * 100, target: 85, next: 'Review course records' }] : []),
    ...data.metrics.filter(m => m.key !== 'pass' && m.value != null && m.value < m.target && matchesStatus(m.value, m.target, status)).map(m => ({ ...m, title: m.label, body: m.note + '.', next: m.key === 'grades' ? 'Check submission records' : 'Explore supporting records' })),
  ].sort((a, b) => (b.target - b.value) - (a.target - a.value));
  const ret = data.metrics[1], sete = data.metrics[3];
  const goTo = id => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  const focusCourse = code => setFocus(f => ({ ...f, course: f.course === code ? null : code }));
  const courseBody = big => <>
    <div className={'mini-bars' + (big ? ' is-big' : '')}>{courses.map(r => { const rate = r.passed / r.attempts * 100; return <button key={r.code} className={'mini-bar' + (focus.course === r.code ? ' is-focused' : '')} aria-pressed={focus.course === r.code} aria-label={`${r.code}, ${r.name}: ${percent(rate)}. Select to focus this course.`} onClick={() => focusCourse(r.code)}><span className="mini-name"><b>{r.code}</b>{big && <small>{r.name}</small>}</span><span className="mini-track"><span className={rate >= 85 ? 'is-met' : rate >= 80 ? 'is-watch' : 'is-risk'} style={{ width: `${rate}%` }}/><i/></span><strong>{percent(rate)}</strong>{big && <em className={rate < 85 ? 'gap-below' : 'gap-above'}>{rate >= 85 ? '+' : ''}{(rate - 85).toFixed(1)} pts</em>}</button>; })}{!courses.length && <div className="overview-empty">No courses match these filters.</div>}</div>
  </>;
  const retentionBody = big => <>
    <div className="mini-headline"><strong>{percent(ret.value)}</strong><span>{data.enrolled} of {data.eligible} eligible students continued</span><Status value={ret.value} target={90}/></div>
    <Chart compact={!big} series={[{ label: cohort === 'all' ? 'All eligible batches' : `Batch ${cohort}`, values: snapshots.map(d => d.metrics[1].value) }]} selected={data.term} onSelect={onTerm} min={80} target={90}/>
  </>;
  const seteBody = big => <>
    <div className="mini-headline"><strong>{percent(sete.value)}</strong><span>{data.valid} valid responses · {percent(data.metrics[4].value)} response rate</span><Status value={sete.value} target={80}/></div>
    <Chart compact={!big} series={[{ label: 'SETE score', values: snapshots.map(d => d.metrics[3].value) }]} selected={data.term} onSelect={onTerm} min={70} max={90} target={80}/>
    {big && <p className="mini-note">Not a sole measure of teaching effectiveness.</p>}
  </>;
  const bodies = { course: courseBody, retention: retentionBody, sete: seteBody };
  const panels = {
    course: ['Course pass rate', `All ${courses.length} courses · lowest first · target 85%`, 'courses', 'View courses'],
    retention: ['Student retention', 'Term-to-term continuation', 'retention', 'View batches'],
    sete: ['SETE score', 'Response-weighted, not a sole measure', 'teaching', 'View teaching'],
  };
  const onTrack = data.metrics.filter(m => m.value != null && m.value >= m.target).length;

  return <div className="overview-page overview-refined" ref={overviewRef}>

    <section className="snapshot-heading" aria-labelledby="snapshot-title">
      <span className="section-kicker">PERFORMANCE SNAPSHOT</span>
      <div className="snapshot-title-row"><h2 id="snapshot-title">Your program, at a glance</h2><div className="snapshot-state"><span className="state-dot"/>{onTrack} of 5 indicators on track</div></div>
      {compare && <p className="snapshot-comparison"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4"/></svg><span>{previous ? `vs ${terms[data.term - 1]}, in percentage points` : 'No previous semester is available for this selection.'}</span></p>}
    </section>
    <div className="alert-strip" role="status" aria-live="polite">
      <div className={'alert-strip-main' + (attention.length ? ' has-alerts' : ' all-clear')}>
        <span className="alert-dot" aria-hidden="true"/>
        {attention.length ? <span><b>{attention.length} indicator{attention.length === 1 ? '' : 's'} off target.</b> Largest gap: {attention[0].title} at {percent(attention[0].value)}, {(attention[0].target - attention[0].value).toFixed(1)} pts below its {attention[0].target}% target.</span> : <span><b>No indicator is off target</b> in this selection.</span>}
      </div>
      <div className="alert-legend" aria-label="Warning thresholds"><span><i className="status watch">Watch</i> up to 5 pts below target</span><span><i className="status at-risk">At risk</i> over 5 pts below</span><span><i className="status watch">Low response</i> SETE response under 70%</span></div>
    </div>
    {metrics.length ? <Metrics metrics={metrics} compare={compare} previous={previous?.metrics} onSelect={onSelect}/> : <div className="overview-empty">No indicators match this status. Try All statuses.</div>}
    <div className="overview-charts" aria-label="Key charts">
      {['course', 'retention', 'sete'].map(key => { const [title, subtitle, view, label] = panels[key]; return <Card key={key} className="overview-chart-card" title={title} subtitle={subtitle} action={<span className="card-actions"><button type="button" className="expand-btn" onClick={() => setExpanded(key)} aria-label={`Enlarge ${title}`} title="Enlarge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button><button className="text-action" onClick={() => goTo(view)}>{label} <span aria-hidden="true">↗</span></button></span>}>{bodies[key](false)}</Card>; })}
    </div>
    <Card className="overview-review-card" title="Needs your attention" subtitle="Largest gap first" action={<span className="attention-count">{attention.length} to review</span>}>
      <div className="review-scroll-region"><div className="review-column-headings" aria-hidden="true"><span>Priority / indicator</span><span>Status</span><span>Current / target</span><span>Action</span></div><div className="review-queue">{attention.map((item, index) => <div className="review-item" key={item.key}><span className="review-number">{String(index + 1).padStart(2, '0')}</span><div className="review-copy"><h3>{item.title}</h3><p>{item.body}</p></div><Status value={item.value} target={item.target}/><div className="review-gap"><strong>{percent(item.value)}</strong><small>Target {item.target}% <span>&middot; { (item.target - item.value).toFixed(1)} pts below</span></small></div><button onClick={() => onSelect(item.key)} aria-label={item.next}>View records<span aria-hidden="true">↗</span></button></div>)}{!attention.length && <div className="overview-empty">No review items match this selection.</div>}</div></div>
    </Card>
    {expanded && createPortal(<div className="overview-refined chart-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setExpanded(null); }}>
      <div className="chart-modal" role="dialog" aria-modal="true" aria-label={panels[expanded][0]}>
        <div className="chart-modal-head"><div><h2>{panels[expanded][0]}</h2><p>{panels[expanded][1]}</p></div><button type="button" className="chart-modal-close" onClick={() => setExpanded(null)} aria-label="Close enlarged view" autoFocus>&times;</button></div>
        <div className="chart-modal-body">{bodies[expanded](true)}</div>
      </div>
    </div>, document.body)}
  </div>;
}
