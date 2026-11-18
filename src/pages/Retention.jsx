import React, { useState } from 'react';
import { Card, Chart, Table, Status } from '../components/UI.jsx';
import { dataset, percent, terms } from '../data.js';

function rateAt(row, term) {
  const value = row.trend[term];
  return value == null ? null : Math.round(row.eligible * value / 100) / row.eligible * 100;
}
export default function Retention({ data, onTerm, onSelect, cohort, dept, status, focus, setFocus }) {
  const [compare, setCompare] = useState(false);
  const selectedCohort = focus.batch, setSelectedCohort = b => setFocus(f => ({ ...f, batch: f.batch === b ? null : b }));
  const rows = [...data.cohorts].sort((a,b)=>a.enrolled/a.eligible-b.enrolled/b.eligible);
  const selected = rows.find(row=>row.cohort===selectedCohort) || rows[0];
  const eligible=rows.reduce((n,r)=>n+r.eligible,0), enrolled=rows.reduce((n,r)=>n+r.enrolled,0);
  const totalRate=eligible?enrolled/eligible*100:null;
  const below=rows.filter(row=>row.enrolled/row.eligible*100<90);
  const current=selected?selected.enrolled/selected.eligible*100:null;
  const previous=selected&&data.term>0?rateAt(selected,data.term-1):null;
  const change=current!=null&&previous!=null?current-previous:null;
  const snapshots=Array.from({length:6},(_,i)=>dataset(String(2023+Math.floor(i/2)),String(i%2+1),cohort,dept));
  const program={label:cohort==='all'?'All eligible batches':`Batch ${cohort}`,values:snapshots.map(d=>d.metrics[1].value)};
  const batches=rows.map(row=>({label:`Batch ${row.cohort}`,values:row.trend.map((_,i)=>rateAt(row,i))}));
  return <div className="retention-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">RETENTION</span><h2>Understand who continues.</h2><p>Follow batch trends and identify where student support needs a closer look.</p></div><div className="intro-chips"><span className="courses-benchmark">Target <b>90%</b></span><span className="courses-benchmark">Program-wide, not affected by Department</span></div></div>
    <div className="retention-analysis-grid">
      <Card title="Term-to-term continuation" subtitle={compare?'Batches across six semesters':'All matching batches, six semesters'} action={<label className="compare-toggle"><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>Compare batches</label>}>
        <Chart series={compare&&batches.length?batches:[program]} selected={data.term} onSelect={onTerm} min={80} target={90}/><p className="course-panel-note">{compare?'One line per batch matching the current filters; missing terms have no eligible batch data. ':'Program-wide line by default. '}Select a term to update all results. Target 90%.</p>
      </Card>
      <aside className="retention-inspector" aria-label="Selected batch details" aria-live="polite">
        <span className="section-kicker">BATCH SPOTLIGHT</span>
        {selected?<><div className="retention-selection" aria-label="Choose a batch to inspect">{rows.map(row=><button key={row.cohort} aria-pressed={selected.cohort===row.cohort} className={selected.cohort===row.cohort?'selected':''} onClick={()=>setSelectedCohort(row.cohort)}>{row.cohort}</button>)}</div><div className="retention-cohort-title"><h3>Batch {selected.cohort}</h3><Status value={current} target={90}/></div><span className="retention-term">{terms[data.term]}</span><div className="retention-spotlight-rate"><strong>{percent(current)}</strong><span>term-to-term retention</span></div><div className={'retention-change '+(change==null?'neutral':change>=0?'positive':'negative')}>{change==null?'No prior-term comparison':`${change>=0?'+':''}${(Math.abs(change)<.05?0:change).toFixed(1)} pts vs prior term`}</div><div className="retention-counts"><div><strong>{selected.enrolled}</strong><span>Continued</span></div><div><strong>{selected.eligible-selected.enrolled}</strong><span>Did not continue</span></div></div><div className="continuation-track" aria-label={`${selected.enrolled} continued, ${selected.eligible-selected.enrolled} did not continue`}><span className={current>=90?'is-met':current>=85?'is-watch':'is-risk'} style={{width:`${current}%`}}/></div><p className="retention-context">Continuation shows whether students enrolled again. It does not explain why others did not continue.</p><button className="inspector-action" onClick={()=>onSelect('retention')}>Open batch records <span aria-hidden="true">↗</span></button></>:<div className="course-empty">Choose another term or filter to inspect a batch.</div>}
      </aside>
    </div>
    <Card title="Retention by batch" subtitle="Lowest retention first · select a batch for its spotlight" action={<span className="course-record-count">{rows.length} batches</span>}>
      <Table headers={['Batch','Eligible prior term','Continued','Did not continue','Retention','Gap to target','Status']} rows={rows.map(row=>{const value=row.enrolled/row.eligible*100;return [<button className={'retention-table-link '+(selected?.cohort===row.cohort?'current':'')} onClick={()=>setSelectedCohort(row.cohort)} aria-pressed={selected?.cohort===row.cohort}>Batch {row.cohort}<span aria-hidden="true">↗</span></button>,row.eligible,row.enrolled,row.eligible-row.enrolled,<b>{percent(value)}</b>,<span className={value>=90?'course-gap-positive':'course-gap-negative'}>{value>=90?'+':''}{(value-90).toFixed(1)} pts</span>,<Status value={value} target={90}/>]})}/>
      <p className="course-panel-note">Retention = continued students ÷ eligible previous-term students. Aggregates use the same counts throughout this page.</p>
    </Card>
    <div className="retention-guidance"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>Use trends to start a conversation.</strong><p>Review enrollment changes with the Registrar and student support teams. Consider transfers, approved leave, and other context before drawing conclusions.</p></div></div>
  </div>;
}
