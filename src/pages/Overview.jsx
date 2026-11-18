import React, { useEffect, useRef } from 'react';
import { Card, Chart, Metrics, Status } from '../components/UI.jsx';
import { dataset, percent, matchesStatus, terms } from '../data.js';

export default function Overview({ data, onSelect, onTerm, cohort, dept, status, compare, focus, setFocus }) {
  const overviewRef = useRef(null);
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
  const lowest = courses.slice(0, 6);
  const ret = data.metrics[1], sete = data.metrics[3];
  const goTo = id => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
      <Card className="overview-chart-card" title="Course pass rate" subtitle={`Lowest ${lowest.length} of ${courses.length} courses`} action={<button className="text-action" onClick={() => goTo('courses')}>View courses <span aria-hidden="true">↗</span></button>}>
        <div className="mini-bars">{lowest.map(r => { const rate = r.passed / r.attempts * 100; return <button key={r.code} className={'mini-bar' + (focus.course === r.code ? ' is-focused' : '')} aria-pressed={focus.course === r.code} aria-label={`${r.code}, ${r.name}: ${percent(rate)}. Select to focus this course.`} onClick={() => setFocus(f => ({ ...f, course: f.course === r.code ? null : r.code }))}><b>{r.code}</b><span className="mini-track"><span className={rate >= 85 ? 'is-met' : rate >= 80 ? 'is-watch' : 'is-risk'} style={{ width: `${rate}%` }}/><i/></span><strong>{percent(rate)}</strong></button>; })}{!lowest.length && <div className="overview-empty">No courses match these filters.</div>}</div>
        <p className="mini-note">Target 85%</p>
      </Card>
      <Card className="overview-chart-card" title="Student retention" subtitle="Term-to-term continuation" action={<button className="text-action" onClick={() => goTo('retention')}>View batches <span aria-hidden="true">↗</span></button>}>
        <div className="mini-headline"><strong>{percent(ret.value)}</strong><Status value={ret.value} target={90}/></div>
        <Chart compact series={[{ label: cohort === 'all' ? 'All eligible batches' : `Batch ${cohort}`, values: snapshots.map(d => d.metrics[1].value) }]} selected={data.term} onSelect={onTerm} min={80} target={90}/>
      </Card>
      <Card className="overview-chart-card" title="SETE score" subtitle="Response-weighted, not a sole measure" action={<button className="text-action" onClick={() => goTo('teaching')}>View teaching <span aria-hidden="true">↗</span></button>}>
        <div className="mini-headline"><strong>{percent(sete.value)}</strong><Status value={sete.value} target={80}/></div>
        <Chart compact series={[{ label: 'SETE score', values: snapshots.map(d => d.metrics[3].value) }]} selected={data.term} onSelect={onTerm} min={70} max={90} target={80}/>
      </Card>
    </div>
    <Card className="overview-review-card" title="Needs your attention" subtitle="Largest gap first" action={<span className="attention-count">{attention.length} to review</span>}>
      <div className="review-scroll-region"><div className="review-column-headings" aria-hidden="true"><span>Priority / indicator</span><span>Status</span><span>Current / target</span><span>Action</span></div><div className="review-queue">{attention.map((item, index) => <div className="review-item" key={item.key}><span className="review-number">{String(index + 1).padStart(2, '0')}</span><div className="review-copy"><h3>{item.title}</h3><p>{item.body}</p></div><Status value={item.value} target={item.target}/><div className="review-gap"><strong>{percent(item.value)}</strong><small>Target {item.target}% <span>&middot; { (item.target - item.value).toFixed(1)} pts below</span></small></div><button onClick={() => onSelect(item.key)} aria-label={item.next}>View records<span aria-hidden="true">↗</span></button></div>)}{!attention.length && <div className="overview-empty">No review items match this selection.</div>}</div></div>
    </Card>
  </div>;
}
