import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, Chart, Metrics, Status } from '../components/UI.jsx';
import { dataset, percent, matchesStatus, terms } from '../data.js';

export default function Overview({ data, onSelect, cohort, dept, onTerm, status, compare, focus, setFocus }) {
  const overviewRef = useRef(null);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (!expanded) return; const onKey = e => { if (e.key === 'Escape') setExpanded(null); }; addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey); }, [expanded]);
  useEffect(() => {
    const panels = overviewRef.current?.querySelectorAll('.overview-course-card, .overview-retention-card, .overview-review-card') || [];
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
      panel.querySelectorAll('.overview-bar, .review-item').forEach((row, index) => row.style.setProperty('--row-delay', `${index * 40}ms`));
      observer.observe(panel);
    });
    return () => {
      observer.disconnect();
      panels.forEach(panel => delete panel.dataset.motion);
    };
  }, []);
  const snapshots = Array.from({ length: 6 }, (_, i) => dataset(String(2023 + Math.floor(i / 2)), String(i % 2 + 1), cohort, dept));
  const previous = snapshots[data.term - 1];
  const metrics = data.metrics.filter(m => matchesStatus(m.value, m.target, status)).map(m => ({ ...m, trend: snapshots.map(d => d.metrics.find(item => item.key === m.key).value) }));
  const courses = [...data.rows].sort((a, b) => a.passed / a.attempts - b.passed / b.attempts);
  const below = courses.filter(r => r.passed / r.attempts * 100 < 85);
  const attention = [
    ...(below.length ? [{ key: 'pass', title: 'Course outcomes', body: `${below.length} courses below target. ${below[0].code} has the lowest pass rate.`, value: below[0].passed / below[0].attempts * 100, target: 85, next: 'Review course records' }] : []),
    ...data.metrics.filter(m => m.key !== 'pass' && m.value != null && m.value < m.target && matchesStatus(m.value, m.target, status)).map(m => ({ ...m, title: m.label, body: m.note + '.', next: m.key === 'grades' ? 'Check submission records' : 'Explore supporting records' })),
  ].sort((a, b) => (b.target - b.value) - (a.target - a.value));
  const onTrack = data.metrics.filter(m => m.value != null && m.value >= m.target).length;

  const courseBody = <>
        <div className="course-chart-summary"><strong>{courses.length}<span>courses shown</span></strong><span className="course-target-note"><i/>85% target</span><span className="below-count">{below.length} below target</span></div>
        {focus.course && <div className="focus-note" role="status"><span>Focused on <b>{focus.course}</b>. Course outcomes, Records and filters now follow it.</span><button className="text-action" onClick={() => { onSelect('pass'); }}>Open records <span aria-hidden="true">↗</span></button><button className="text-action" onClick={() => setFocus(f => ({ ...f, course: null }))}>Clear</button></div>}
        <div className="performance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div><div className="overview-bars">{courses.map(r => { const rate = r.passed / r.attempts * 100; return <button className={'overview-bar' + (focus.course === r.code ? ' is-focused' : focus.course ? ' is-dimmed' : '')} key={r.code} onClick={() => setFocus(f => ({ ...f, course: f.course === r.code ? null : r.code }))} aria-pressed={focus.course === r.code} aria-label={`${r.code}, ${r.name}: ${percent(rate)}. Select to focus this course across the dashboard.`}><span className="bar-course"><strong>{r.code}</strong><small title={r.name}>{r.name}</small></span><span className="overview-bar-track"><span className={rate >= 85 ? 'is-met' : rate >= 80 ? 'is-watch' : 'is-risk'} style={{ width: `${rate}%` }}/><i/></span><span className="performance-rate"><b>{percent(rate)}</b><small className={rate<85?'gap-below':'gap-above'}>{rate>=85?'+':''}{(rate-85).toFixed(1)} pts</small></span></button>; })}{!courses.length && <div className="overview-empty">No courses match these filters.</div>}</div>
        </>;
  const retentionBody = <>
        <div className="retention-headline"><div><strong>{percent(data.metrics[1].value)}</strong><span>{data.enrolled} of {data.eligible} eligible students continued</span></div><Status value={data.metrics[1].value} target={90}/></div>
        <div className="retention-comparison-row"><span>Target <b>90%</b></span><span className={data.metrics[1].value==null?'neutral':data.metrics[1].value>=90?'positive':'negative'}>{data.metrics[1].value==null?'No eligible population':`${Math.abs(data.metrics[1].value-90).toFixed(1)} pts ${data.metrics[1].value>=90?'above':'below'} target`}</span></div>
        <div className="retention-chart-block">
        <Chart series={[{ label: cohort === 'all' ? 'All eligible batches' : `Batch ${cohort}`, values: snapshots.map(d => d.metrics[1].value) }]} selected={data.term} onSelect={onTerm} min={80} target={90}/>
        </div>
        </>;
  const seteBody = <>
        <div className="retention-headline"><div><strong>{percent(data.metrics[3].value)}</strong><span>{data.valid} valid responses · {percent(data.metrics[4].value)} response rate</span></div><Status value={data.metrics[3].value} target={80}/></div>
        <div className="retention-chart-block"><Chart series={[{ label: 'SETE effectiveness', values: snapshots.map(d => d.metrics[3].value) }]} selected={data.term} onSelect={onTerm} min={70} max={90} target={80}/></div>
        <div className="card-footnote">Not a sole measure of teaching effectiveness.</div>
        </>;
  const modals = { course: ['Course performance', 'Pass rate by course · lowest first', courseBody], retention: ['Student retention', 'Term-to-term continuation', retentionBody], sete: ['SETE effectiveness', 'Response-weighted score across semesters', seteBody] };
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
    {metrics.length ? <Metrics selectedTerm={data.term} metrics={metrics} compare={compare} previous={previous?.metrics} onSelect={onSelect}/> : <div className="overview-empty">No indicators match this status. Try All statuses.</div>}
    <div className="overview-charts">
      <Card className="overview-course-card" title="Course performance" subtitle="Pass rate by course · lowest first" action={<span className="card-actions"><button type="button" className="expand-btn" onClick={() => setExpanded('course')} aria-label="Enlarge Course performance" title="Enlarge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button><button className="text-action" onClick={() => { document.getElementById('courses')?.scrollIntoView({behavior:'smooth'}); }}>View courses <span aria-hidden="true">↗</span></button></span>}>
        {courseBody}
      </Card>
      <Card className="overview-retention-card" title="Student retention" subtitle="Term-to-term continuation" action={<span className="card-actions"><button type="button" className="expand-btn" onClick={() => setExpanded('retention')} aria-label="Enlarge Student retention" title="Enlarge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button><button className="text-action" onClick={() => { document.getElementById('retention')?.scrollIntoView({behavior:'smooth'}); }}>View batches <span aria-hidden="true">↗</span></button></span>}>
        {retentionBody}
      </Card>
      <Card className="overview-sete-card" title="SETE effectiveness" subtitle="Response-weighted score across semesters" action={<span className="card-actions"><button type="button" className="expand-btn" onClick={() => setExpanded('sete')} aria-label="Enlarge SETE effectiveness" title="Enlarge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button><button className="text-action" onClick={() => { document.getElementById('teaching')?.scrollIntoView({behavior:'smooth'}); }}>View teaching <span aria-hidden="true">↗</span></button></span>}>
        {seteBody}
      </Card>
    </div>
    <Card className="overview-review-card" title="Needs your attention" subtitle="Largest gap first" action={<span className="attention-count">{attention.length} to review</span>}>
      <div className="review-scroll-region"><div className="review-column-headings" aria-hidden="true"><span>Priority / indicator</span><span>Status</span><span>Current / target</span><span>Action</span></div><div className="review-queue">{attention.map((item, index) => <div className="review-item" key={item.key}><span className="review-number">{String(index + 1).padStart(2, '0')}</span><div className="review-copy"><h3>{item.title}</h3><p>{item.body}</p></div><Status value={item.value} target={item.target}/><div className="review-gap"><strong>{percent(item.value)}</strong><small>Target {item.target}% <span>&middot; { (item.target - item.value).toFixed(1)} pts below</span></small></div><button onClick={() => onSelect(item.key)} aria-label={item.next}>View records<span aria-hidden="true">↗</span></button></div>)}{!attention.length && <div className="overview-empty">No review items match this selection.</div>}</div></div>
    </Card>
    {expanded && createPortal(<div className="overview-refined chart-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setExpanded(null); }}>
      <div className={'chart-modal overview-' + (expanded === 'sete' ? 'sete' : expanded) + '-card'} role="dialog" aria-modal="true" aria-label={modals[expanded][0]}>
        <div className="chart-modal-head"><div><h2>{modals[expanded][0]}</h2><p>{modals[expanded][1]}</p></div><button type="button" className="chart-modal-close" onClick={() => setExpanded(null)} aria-label="Close enlarged view" autoFocus>&times;</button></div>
        <div className="chart-modal-body">{modals[expanded][2]}</div>
      </div>
    </div>, document.body)}
  </div>;
}
