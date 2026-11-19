import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table } from '../components/UI.jsx';
import Dropdown from '../components/Dropdown.jsx';
import { MODEL, factors, riskView, riskLine, supportFor, valueText, scoredTerm } from '../risk.js';

const PAGE = 10;
const pct = v => `${Math.round(v * 100)}%`;
const loadPlan = () => { try { return new Set(JSON.parse(sessionStorage.getItem('decisete-support-plan')) || []); } catch { return new Set(); } };

function Level({ level }) {
  return <span className={'status ' + (level === 'High' ? 'at-risk' : 'watch')}>{level === 'High' ? 'High risk' : 'Elevated'}</span>;
}

export default function Risk({ cohort, dept, focus, setFocus }) {
  const [factor, setFactor] = useState(null);
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('risk');
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [plan, setPlan] = useState(loadPlan);
  const [message, setMessage] = useState('');

  useEffect(() => { try { sessionStorage.setItem('decisete-support-plan', JSON.stringify([...plan])); } catch { /* storage unavailable */ } }, [plan]);
  useEffect(() => { setShown(PAGE); }, [factor, level, sort, search, cohort, dept, focus.batch]);

  const scopeView = useMemo(() => riskView({ cohort, dept }), [cohort, dept]);
  const view = useMemo(() => riskView({ cohort, dept, batch: focus.batch }), [cohort, dept, focus.batch]);
  const line = riskLine(view);
  const maxFlag = Math.max(1, ...scopeView.byBatch.map(b => b.flagged));

  const rows = view.flagged
    .filter(s => (level === 'all' || s.level === level) && (!factor || s.drivers.includes(factor)) && s.id.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === 'risk' ? b.score - a.score : sort === 'batch' ? a.batch.localeCompare(b.batch) || b.score - a.score : a.id.localeCompare(b.id));
  const planned = view.flagged.filter(s => plan.has(s.id));

  const toggle = id => { setMessage(''); setPlan(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const addHigh = () => { setMessage(''); setPlan(p => new Set([...p, ...rows.filter(s => s.level === 'High').map(s => s.id)])); };
  const pickBatch = b => setFocus(f => ({ ...f, batch: f.batch === b ? null : b }));

  function download() {
    const list = planned.length ? planned : rows;
    const head = ['Student ID', 'Batch', 'Year level', 'Department', 'Risk score', 'Risk level', 'Main factors', 'Suggested support'];
    const csv = [head, ...list.map(s => [s.id, 'Batch ' + s.batch, 'Year ' + s.year, s.dept, pct(s.score), s.level, s.drivers.map(k => valueText(s, k)).join('; '), supportFor(s)])]
      .map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bsit-support-plan.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${list.length} student${list.length === 1 ? '' : 's'} prepared for CSV download${planned.length ? ' (support plan)' : ' (current list)'}.`);
  }

  const visible = rows.slice(0, shown);
  const scopeLabel = `${cohort === 'all' ? 'All batches' : 'Batch ' + cohort} · ${dept === 'all' ? 'All departments' : dept}`;

  return <div className="risk-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">AT-RISK STUDENTS</span><h2>Know who needs support first.</h2><p>The risk model scores every continuing student and flags those who may fall behind, so support can start before grades are final.</p></div><div className="intro-chips"><span className="courses-benchmark">Scored for <b>{scoredTerm}</b></span><span className="courses-benchmark">Flag at <b>{pct(MODEL.threshold)}+</b></span></div></div>

    <div className="risk-analysis-grid">
      <Card title="Where support is needed" subtitle="Flagged students by batch · select a batch to focus the list" action={<span className="course-record-count">{view.flagged.length} flagged of {view.scope.length}</span>}>
        <div className="risk-bars">{scopeView.byBatch.map(b => <button key={b.batch} type="button" className={'risk-bar' + (focus.batch === b.batch ? ' is-focused' : '')} aria-pressed={focus.batch === b.batch} onClick={() => pickBatch(b.batch)} aria-label={`Batch ${b.batch}: ${b.flagged} of ${b.total} students flagged, ${b.high} high risk. Select to focus this batch.`}>
          <span className="risk-bar-name"><b>Batch {b.batch}</b><small>{b.total} students</small></span>
          <span className="risk-bar-track"><span className="is-high" style={{ width: `${b.high / maxFlag * 100}%` }}/><span className="is-elevated" style={{ width: `${(b.flagged - b.high) / maxFlag * 100}%` }}/></span>
          <strong>{b.flagged}</strong><em>{Math.round(b.flagged / b.total * 100)}% flagged</em>
        </button>)}{!scopeView.byBatch.length && <div className="course-empty">No students match these filters.</div>}</div>
        <div className="risk-legend"><span><i className="is-high"/>High risk (50%+)</span><span><i className="is-elevated"/>Elevated (20–49%)</span></div>
        <p className="course-panel-note">Each score is the model's estimated chance that a student falls behind. Flags are a prompt for follow-up, not a decision about the student.</p>
      </Card>

      <aside className="risk-drivers" aria-label="Factors behind the flags">
        <span className="section-kicker">WHY STUDENTS ARE FLAGGED</span>
        <h3>Main factor per student</h3>
        <p className="risk-drivers-lead">Select a factor to list the students it affects.</p>
        <div className="risk-driver-list">{view.byFactor.map(f => <button key={f.key} type="button" className={'risk-driver' + (factor === f.key ? ' is-focused' : '')} aria-pressed={factor === f.key} onClick={() => setFactor(x => x === f.key ? null : f.key)}>
          <span><b>{f.label}</b><small>{f.any} flagged students affected</small></span><strong>{f.count}</strong>
        </button>)}</div>
        <p className="risk-drivers-note">Counts show each student's single strongest factor. Students can have more than one.</p>
      </aside>
    </div>

    <Card title="Students to prioritize" subtitle={`Highest risk first · ${scopeLabel}`} action={<button type="button" className="records-export" disabled={!rows.length && !planned.length} onClick={download}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>{planned.length ? 'Export support plan' : 'Export list'}</button>}>
      <div className="risk-plan" role="status" aria-live="polite">
        <div><strong>{planned.length}</strong><span>{planned.length === 1 ? 'student' : 'students'} in the support plan</span></div>
        <div className="risk-plan-actions">
          <button type="button" onClick={addHigh} disabled={!rows.some(s => s.level === 'High')}>Add all high-risk in this list</button>
          <button type="button" onClick={() => { setPlan(new Set()); setMessage(''); }} disabled={!plan.size}>Clear plan</button>
        </div>
      </div>
      <div className="records-toolbar risk-toolbar">
        <label className="course-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Search student ID" placeholder="Search student ID…" value={search} onChange={e => setSearch(e.target.value)}/></label>
        <Dropdown label="Risk level" value={level} onChange={setLevel} options={[{ value: 'all', label: 'All flagged' }, { value: 'High', label: 'High risk' }, { value: 'Elevated', label: 'Elevated' }]}/>
        <Dropdown label="Sort students" value={sort} onChange={setSort} options={[{ value: 'risk', label: 'Highest risk' }, { value: 'batch', label: 'Batch' }, { value: 'id', label: 'Student ID' }]}/>
      </div>
      <div className="records-meta" aria-live="polite"><span><b>{rows.length}</b> students listed</span>{focus.batch && <span className="records-focus">Focused on <b>Batch {focus.batch}</b> (clear it in the filter bar)</span>}{factor && <span className="records-focus">Factor: <b>{factors[factor].short}</b> <button type="button" className="risk-clear" onClick={() => setFactor(null)}>clear</button></span>}</div>
      <Table headers={['Plan', 'Student', 'Batch', 'Risk score', 'Level', 'Main factors', 'Suggested support']} rows={visible.map(s => [
        <input type="checkbox" className="risk-check" checked={plan.has(s.id)} onChange={() => toggle(s.id)} aria-label={`Add ${s.id} to the support plan`}/>,
        <b className="risk-id">{s.id}</b>,
        `Batch ${s.batch} · Year ${s.year}`,
        <span className="risk-score"><span className="risk-meter" aria-hidden="true"><i className={s.level === 'High' ? 'is-high' : 'is-elevated'} style={{ width: pct(s.score) }}/></span><b>{pct(s.score)}</b></span>,
        <Level level={s.level}/>,
        <span className="risk-chips">{s.drivers.map(k => <span key={k} className="risk-chip">{valueText(s, k)}</span>)}</span>,
        <span className="risk-support">{supportFor(s)}</span>,
      ])}/>
      <div className="records-table-footer"><span>{rows.length ? `Showing ${visible.length} of ${rows.length} flagged students` : 'No flagged students match this view. Try another filter.'}</span>{rows.length > shown && <button type="button" className="risk-more" onClick={() => setShown(n => n + PAGE)}>Show {Math.min(PAGE, rows.length - shown)} more</button>}</div>
      <p className="records-download-message" role="status" aria-live="polite">{message}</p>
    </Card>

    <div className="retention-guidance"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>Use flags to start a conversation, not to label a student.</strong><p>The model weighs previous GWA, failed or INC subjects, repeated subjects, units enrolled and year level. Confirm each case with the adviser before acting. Student IDs are anonymous sample IDs, and the model was trained on synthetic data for this prototype.</p></div></div>
    {line && <p className="sr-only">{line.flagged} of {line.total} students flagged.</p>}
  </div>;
}
