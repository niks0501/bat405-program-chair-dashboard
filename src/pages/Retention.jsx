import React, { useState } from 'react';
import { Card, Chart, Table, Status, Metrics } from '../components/UI.jsx';
import { percent, terms, dataset, matchesStatus } from '../data.js';

function rateAt(row, term) {
  const value = row.trend[term];
  return value == null ? null : Math.round(row.eligible * value / 100) / row.eligible * 100;
}
export default function Retention({ data, onTerm, onSelect, cohort, status }) {
  const [selectedCohort, setSelectedCohort] = useState(null);
  const rows = [...data.cohorts].sort((a,b)=>a.enrolled/a.eligible-b.enrolled/b.eligible);
  const selected = rows.find(row=>row.cohort===selectedCohort) || rows[0];
  const eligible=rows.reduce((n,r)=>n+r.eligible,0), enrolled=rows.reduce((n,r)=>n+r.enrolled,0);
  const totalRate=eligible?enrolled/eligible*100:null;
  const below=rows.filter(row=>row.enrolled/row.eligible*100<90);
  const current=selected?selected.enrolled/selected.eligible*100:null;
  const previous=selected&&data.term>0?rateAt(selected,data.term-1):null;
  const change=current!=null&&previous!=null?current-previous:null;
  const series=rows.map(row=>({label:`Cohort ${row.cohort}`,values:row.trend.map((_,i)=>rateAt(row,i))}));
  const history=Array.from({length:6},(_,i)=>{
    const d=dataset(String(2023+Math.floor(i/2)),String(i%2+1),cohort);
    const list=d.cohorts.filter(r=>matchesStatus(r.enrolled/r.eligible*100,90,status));
    const e=list.reduce((v,r)=>v+r.eligible,0),n=list.reduce((v,r)=>v+r.enrolled,0),met=list.filter(r=>r.enrolled/r.eligible*100>=90).length;
    return {rate:e?n/e*100:null,enrolled:n,eligible:e,met,below:list.length-met,count:list.length};
  });
  const prior=history[data.term-1];
  const changeLabel=(key,unit)=>!prior?'No prior-term data':history[data.term][key]===prior[key]?'No change vs prior term':`${history[data.term][key]-prior[key]>0?'+':''}${history[data.term][key]-prior[key]} ${unit} vs prior term`;
  const summary=[
    {key:'retention',label:'Weighted retention',value:totalRate,target:90,note:`${enrolled} of ${eligible} eligible students continued`,trend:history.map(d=>d.rate)},
    {key:'continued',label:'Students continued',value:totalRate,target:90,displayValue:String(enrolled),badge:'Current view',badgeTone:'no-data',targetLabel:`${eligible} eligible prior-term students`,showTarget:false,note:'Across matching cohorts',changeLabel:changeLabel('enrolled','students'),trend:history.map(d=>d.enrolled)},
    {key:'meeting',label:'Cohorts meeting target',value:rows.length?(rows.length-below.length)/rows.length*100:null,displayValue:String(rows.length-below.length),target:100,showTarget:false,badge:'On track',badgeTone:'on-track',targetLabel:'At or above 90% retention',note:`${rows.length} cohorts currently shown`,changeLabel:changeLabel('met','cohorts'),trend:history.map(d=>d.met)},
    {key:'below',label:'Cohorts below target',value:rows.length?below.length/rows.length*100:null,displayValue:String(below.length),target:100,showTarget:false,badge:'Review',badgeTone:'watch',targetLabel:'Below 90% retention',note:'Review continuation barriers',changeLabel:changeLabel('below','cohorts'),trend:history.map(d=>d.below)},
  ];
  return <div className="retention-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">STUDENT CONTINUATION</span><h2>Understand who continues.</h2><p>Follow cohort trends and identify where student support needs a closer look.</p></div><span className="courses-benchmark">Proposed target <b>90%</b></span></div>
    <div className="overview-page overview-refined analytics-kpi-grid"><Metrics metrics={summary} previous={prior?[{key:'retention',value:prior.rate}]:undefined} compare selectedTerm={data.term} onSelect={()=>onSelect('retention')}/></div>
    <div className="retention-analysis-grid">
      <Card title="Cohort retention trends" subtitle="Continuation across six semesters" action={<span className="course-chart-key"><i/>90% target</span>}>
        {series.length?<><Chart series={series} selected={data.term} onSelect={onTerm} min={80} target={90}/><p className="course-panel-note">Select a term to update all results. Trends show cohorts matching the current filters; missing terms have no eligible cohort data.</p></>:<div className="course-empty">No cohorts match this term and status. Try another filter selection.</div>}
      </Card>
      <aside className="retention-inspector" aria-label="Selected cohort details" aria-live="polite">
        <span className="section-kicker">COHORT SPOTLIGHT</span>
        {selected?<><div className="retention-selection" aria-label="Choose a cohort to inspect">{rows.map(row=><button key={row.cohort} aria-pressed={selected.cohort===row.cohort} className={selected.cohort===row.cohort?'selected':''} onClick={()=>setSelectedCohort(row.cohort)}>{row.cohort}</button>)}</div><div className="retention-cohort-title"><h3>Cohort {selected.cohort}</h3><Status value={current} target={90}/></div><span className="retention-term">{terms[data.term]}</span><div className="retention-spotlight-rate"><strong>{percent(current)}</strong><span>term-to-term retention</span></div><div className={'retention-change '+(change==null?'neutral':change>=0?'positive':'negative')}>{change==null?'No prior-term comparison':`${change>=0?'+':''}${(Math.abs(change)<.05?0:change).toFixed(1)} pts vs prior term`}</div><div className="retention-counts"><div><strong>{selected.enrolled}</strong><span>Continued</span></div><div><strong>{selected.eligible-selected.enrolled}</strong><span>Did not continue</span></div></div><div className="continuation-track" aria-label={`${selected.enrolled} continued, ${selected.eligible-selected.enrolled} did not continue`}><span style={{width:`${current}%`}}/></div><p className="retention-context">Continuation shows whether students enrolled again. It does not explain why others did not continue.</p><button className="inspector-action" onClick={()=>onSelect('retention')}>Open cohort records <span aria-hidden="true">↗</span></button></>:<div className="course-empty">Choose another term or filter to inspect a cohort.</div>}
      </aside>
    </div>
    <Card title="Retention by cohort" subtitle="Lowest retention first · select a cohort for its spotlight" action={<span className="course-record-count">{rows.length} cohorts</span>}>
      <Table headers={['Cohort','Eligible prior term','Continued','Did not continue','Retention','Gap to target','Status']} rows={rows.map(row=>{const value=row.enrolled/row.eligible*100;return [<button className={'retention-table-link '+(selected?.cohort===row.cohort?'current':'')} onClick={()=>setSelectedCohort(row.cohort)} aria-pressed={selected?.cohort===row.cohort}>Cohort {row.cohort}<span aria-hidden="true">↗</span></button>,row.eligible,row.enrolled,row.eligible-row.enrolled,<b>{percent(value)}</b>,<span className={value>=90?'course-gap-positive':'course-gap-negative'}>{value>=90?'+':''}{(value-90).toFixed(1)} pts</span>,<Status value={value} target={90}/>]})}/>
      <p className="course-panel-note">Retention = continued students ÷ eligible previous-term students. Sample aggregates use the same counts throughout this page.</p>
    </Card>
    <div className="retention-guidance"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>Use trends to start a conversation.</strong><p>Review enrollment changes with the Registrar and student support teams. Consider transfers, approved leave, and other context before drawing conclusions.</p></div></div>
  </div>;
}
