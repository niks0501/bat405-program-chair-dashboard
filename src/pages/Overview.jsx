import React, { useEffect, useRef } from 'react';
import { Card, Chart, Metrics, Status } from '../components/UI.jsx';
import { dataset, percent, matchesStatus, terms } from '../data.js';

export default function Overview({ data, onSelect, cohort, onTerm, status, compare }) {
  const overviewRef = useRef(null);
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
  const snapshots = Array.from({ length: 6 }, (_, i) => dataset(String(2023 + Math.floor(i / 2)), String(i % 2 + 1), cohort));
  const previous = snapshots[data.term - 1];
  const metrics = data.metrics.filter(m => matchesStatus(m.value, m.target, status)).map(m => ({ ...m, trend: snapshots.map(d => d.metrics.find(item => item.key === m.key).value) }));
  const courses = [...data.rows].sort((a, b) => a.passed / a.attempts - b.passed / b.attempts);
  const below = courses.filter(r => r.passed / r.attempts * 100 < 85);
  const attention = [
    ...(below.length ? [{ key: 'pass', title: 'Course outcomes', body: `${below.length} courses below target. ${below[0].code} has the lowest pass rate.`, value: below[0].passed / below[0].attempts * 100, target: 85, next: 'Review course records' }] : []),
    ...data.metrics.filter(m => m.key !== 'pass' && m.value != null && m.value < m.target && matchesStatus(m.value, m.target, status)).map(m => ({ ...m, title: m.label, body: m.note + '.', next: m.key === 'grades' ? 'Check submission records' : 'Explore supporting records' })),
  ].sort((a, b) => (b.target - b.value) - (a.target - a.value));
  const onTrack = data.metrics.filter(m => m.value != null && m.value >= m.target).length;

  return <div className="overview-page overview-refined" ref={overviewRef}>

    <section className="snapshot-heading" aria-labelledby="snapshot-title">
      <span className="section-kicker">PERFORMANCE SNAPSHOT</span>
      <div className="snapshot-title-row"><h2 id="snapshot-title">Your program, at a glance</h2><div className="snapshot-state"><span className="state-dot"/>{onTrack} of 5 indicators on track</div></div>
      <p className="snapshot-description">Key outcomes for the selected term. Start here, then explore the details.</p>
      {compare && <p className="snapshot-comparison"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4"/></svg><span>{previous ? `Compared with ${terms[data.term - 1]}. Changes are in percentage points, using the same cohort selection.` : 'No previous semester is available for this selection.'}</span></p>}
    </section>
    {metrics.length ? <Metrics selectedTerm={data.term} metrics={metrics} compare={compare} previous={previous?.metrics} onSelect={onSelect}/> : <div className="overview-empty">No indicators match this status. Try All statuses.</div>}
    <div className="overview-charts">
      <Card className="overview-course-card" title="Course performance" subtitle="Pass rate by course · lowest first" action={<button className="text-action" onClick={() => { document.getElementById('courses')?.scrollIntoView({behavior:'smooth'}); }}>View courses <span aria-hidden="true">↗</span></button>}>
        <div className="course-chart-summary"><strong>{courses.length}<span>courses shown</span></strong><span className="course-target-note"><i/>85% target</span><span className="below-count">{below.length} below target</span></div>
        <div className="performance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div><div className="overview-bars">{courses.map(r => { const rate = r.passed / r.attempts * 100; return <button className="overview-bar" key={r.code} onClick={() => onSelect('pass')} aria-label={`${r.code}, ${r.name}: ${percent(rate)}. View course records.`}><span className="bar-course"><strong>{r.code}</strong><small title={r.name}>{r.name}</small></span><span className="overview-bar-track"><span className={rate < 85 ? 'below-target' : ''} style={{ width: `${rate}%` }}/><i/></span><span className="performance-rate"><b>{percent(rate)}</b><small className={rate<85?'gap-below':'gap-above'}>{rate>=85?'+':''}{(rate-85).toFixed(1)} pts</small></span></button>; })}{!courses.length && <div className="overview-empty">No courses match these filters.</div>}</div>
        <div className="card-footnote"><span className="legend-mark"/>Meets target <span className="performance-legend-below"><i/>Below target</span><span className="performance-definition">Passed / finalized attempts</span></div>
      </Card>
      <Card className="overview-retention-card" title="Student retention" subtitle="Term-to-term continuation" action={<button className="text-action" onClick={() => { document.getElementById('retention')?.scrollIntoView({behavior:'smooth'}); }}>View cohorts <span aria-hidden="true">↗</span></button>}>
        <div className="retention-headline"><div><strong>{percent(data.metrics[1].value)}</strong><span>{data.enrolled} of {data.eligible} eligible students continued</span></div><Status value={data.metrics[1].value} target={90}/></div>
        <div className="retention-comparison-row"><span>Target <b>90%</b></span><span className={data.metrics[1].value==null?'neutral':data.metrics[1].value>=90?'positive':'negative'}>{data.metrics[1].value==null?'No eligible population':`${Math.abs(data.metrics[1].value-90).toFixed(1)} pts ${data.metrics[1].value>=90?'above':'below'} target`}</span></div>
        <div className="retention-chart-block">
        <Chart series={[{ label: cohort === 'all' ? 'All eligible cohorts' : `Cohort ${cohort}`, values: snapshots.map(d => d.metrics[1].value) }]} selected={data.term} onSelect={onTerm} min={80} target={90}/>
        </div>
        <div className="retention-term-detail"><span><i/>Selected term <strong>{terms[data.term]}</strong></span><span className={previous&&data.metrics[1].value!=null&&previous.metrics[1].value!=null?(data.metrics[1].value>=previous.metrics[1].value?'positive':'negative'):'neutral'}>{previous&&data.metrics[1].value!=null&&previous.metrics[1].value!=null?`${data.metrics[1].value-previous.metrics[1].value>=0?'+':''}${(data.metrics[1].value-previous.metrics[1].value).toFixed(1)} pts vs prior term`:'No prior-term comparison'}</span></div>
        <div className="card-footnote">Full cohort trend · select a term to update the dashboard</div>
      </Card>
    </div>
    <Card className="overview-review-card" title="Review priorities" subtitle="The largest gaps first. Review the context before taking action." action={<span className="attention-count">{attention.length} to review</span>}>
      <div className="review-scroll-region"><div className="review-column-headings" aria-hidden="true"><span>Priority / indicator</span><span>Status</span><span>Current / target</span><span>Action</span></div><div className="review-queue">{attention.map((item, index) => <div className="review-item" key={item.key}><span className="review-number">{String(index + 1).padStart(2, '0')}</span><div className="review-copy"><h3>{item.title}</h3><p>{item.body}</p></div><Status value={item.value} target={item.target}/><div className="review-gap"><strong>{percent(item.value)}</strong><small>Target {item.target}% <span>&middot; { (item.target - item.value).toFixed(1)} pts below</span></small></div><button onClick={() => onSelect(item.key)} aria-label={item.next}>View records<span aria-hidden="true">↗</span></button></div>)}{!attention.length && <div className="overview-empty">No review items match this selection.</div>}</div></div>
      <div className="card-footnote">Benchmarks support human review.</div>
    </Card>
  </div>;
}
