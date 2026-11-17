import React, { useMemo, useState } from 'react';
import { Card, Status, Table, Metrics } from '../components/UI.jsx';
import Dropdown from '../components/Dropdown.jsx';
import { percent, dataset, matchesStatus } from '../data.js';

export default function Courses({ data, onSelect, cohort, status }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lowest');
  const [selectedCode, setSelectedCode] = useState(null);
  const rows = useMemo(() => data.rows.filter(r => `${r.code} ${r.name}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b) => sort === 'code' ? a.code.localeCompare(b.code) : (sort === 'highest' ? -1 : 1) * (a.passed/a.attempts-b.passed/b.attempts)), [data.rows, search, sort]);
  const selected = rows.find(r => r.code === selectedCode) || rows[0];
  const attempts = rows.reduce((n,r)=>n+r.attempts,0), passed=rows.reduce((n,r)=>n+r.passed,0);
  const below = rows.filter(r=>r.passed/r.attempts*100<85);
  const rate = attempts ? passed/attempts*100 : null;

  const snapshots=Array.from({length:6},(_,i)=>{
    const d=dataset(String(2023+Math.floor(i/2)),String(i%2+1),cohort);
    const list=d.rows.filter(r=>matchesStatus(r.passed/r.attempts*100,85,status)&&`${r.code} ${r.name}`.toLowerCase().includes(search.trim().toLowerCase()));
    const n=list.length,total=list.reduce((v,r)=>v+r.attempts,0),p=list.reduce((v,r)=>v+r.passed,0),met=list.filter(r=>r.passed/r.attempts*100>=85).length;
    return {count:n,rate:total?p/total*100:null,met,below:n-met};
  });
  const previousSummary=snapshots[data.term-1];
  const countChange=key=>!previousSummary?'No prior-term data':snapshots[data.term][key]===previousSummary[key]?'No change vs prior term':`${snapshots[data.term][key]-previousSummary[key]>0?'+':''}${snapshots[data.term][key]-previousSummary[key]} courses vs prior term`;
  const summaryMetrics=[
    {key:'courses',label:'Courses shown',value:rows.length?100:null,displayValue:String(rows.length),target:100,badge:'Current view',badgeTone:'no-data',note:'Matching filters and search',targetLabel:'Selected course records',showTarget:false,changeLabel:countChange('count'),trend:snapshots.map(d=>d.count)},
    {key:'pass',label:'Weighted pass rate',value:rate,target:85,note:`${passed} of ${attempts} attempts passed`,trend:snapshots.map(d=>d.rate)},
    {key:'meeting',label:'Meeting target',value:rows.length?(rows.length-below.length)/rows.length*100:null,displayValue:String(rows.length-below.length),target:100,badge:'On track',badgeTone:'on-track',note:'Courses at or above the 85% target',targetLabel:rows.length?`${((rows.length-below.length)/rows.length*100).toFixed(1)}% of shown courses`:'No matching courses',showTarget:false,changeLabel:countChange('met'),trend:snapshots.map(d=>d.met)},
    {key:'below',label:'Below target',value:rows.length?below.length/rows.length*100:null,displayValue:String(below.length),target:100,badge:'Review',badgeTone:'watch',note:'Courses for contextual review',targetLabel:rows.length?`${(below.length/rows.length*100).toFixed(1)}% of shown courses`:'No matching courses',showTarget:false,changeLabel:countChange('below'),trend:snapshots.map(d=>d.below)},
  ];
  const previousMetrics=previousSummary?[{key:'pass',value:previousSummary.rate}]:undefined;

  return <div className="courses-page course-outcomes-page">
    <div className="courses-intro"><div><span className="section-kicker">COURSE PERFORMANCE</span><h2>Find the gaps. Focus the support.</h2><p>Explore finalized course outcomes and identify where a closer review may help.</p></div><span className="courses-benchmark">Target <b>85%</b></span></div>
    <div className="course-controls"><label className="course-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Search courses by code or name" placeholder="Search course code or name…" value={search} onChange={e=>setSearch(e.target.value)}/></label><Dropdown label="Sort courses" value={sort} onChange={setSort} options={[{value:'lowest',label:'Lowest pass rate'},{value:'highest',label:'Highest pass rate'},{value:'code',label:'Course code'}]}/></div>
    <div className="overview-page overview-refined course-summary-overview"><Metrics metrics={summaryMetrics} previous={previousMetrics} compare selectedTerm={data.term} onSelect={()=>onSelect('pass')}/></div>
    <div className="course-analysis-grid">
      <Card title="Pass rate comparison" subtitle="Select a course to inspect its outcome" action={<span className="course-chart-key"><i/>85% target</span>}>
        <div className="course-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
        <div className="course-chart-rows">{rows.map(r=>{const value=r.passed/r.attempts*100;return <button key={r.code} className={'course-chart-row '+(selected?.code===r.code?'is-selected':'')} aria-pressed={selected?.code===r.code} onClick={()=>setSelectedCode(r.code)} aria-label={`${r.code}, ${r.name}, ${percent(value)} pass rate. Inspect course.`}><span className="course-chart-label"><b>{r.code}</b><small title={r.name}>{r.name}</small></span><span className="course-chart-track"><span className={value<85?'below':''} style={{width:`${value}%`}}/><i/></span><strong>{percent(value)}</strong></button>})}{!rows.length&&<div className="course-empty">No courses match this selection. Try another search or filter.</div>}</div>
        <p className="course-panel-note">Finalized graded attempts · percentages start at zero.</p>
      </Card>
      <aside className="course-inspector" aria-label="Selected course details" aria-live="polite">{selected?<><span className="section-kicker">SELECTED COURSE</span><div className="inspector-code">{selected.code}<span>Year {selected.year}</span></div><h3>{selected.name}</h3><Status value={selected.passed/selected.attempts*100}/><div className="inspector-rate"><strong>{percent(selected.passed/selected.attempts*100)}</strong><span>finalized pass rate</span></div><div className="inspector-counts"><div><b>{selected.attempts}</b><span>Attempts</span></div><div><b>{selected.passed}</b><span>Passed</span></div><div><b>{selected.attempts-selected.passed}</b><span>Not passed</span></div></div><div className={'inspector-gap '+(selected.passed/selected.attempts*100>=85?'meets':'')}><strong>{Math.abs(selected.passed/selected.attempts*100-85).toFixed(1)} pts {selected.passed/selected.attempts*100>=85?'above':'below'} target</strong><p>{selected.passed/selected.attempts*100>=85?'Meets the benchmark. Review alongside course context.':'Verify finalized grades and discuss support needs with the course team.'}</p></div><button className="inspector-action" onClick={()=>onSelect('pass')}>Open course records <span aria-hidden="true">↗</span></button></>:<div className="course-empty">Select a matching course to see its details.</div>}</aside>
    </div>
    <Card title="Course records" subtitle="Counts and percentages for the courses currently shown" action={<span className="course-record-count">{rows.length} courses</span>}>
      <Table headers={['Course','Year level','Attempts','Passed','Pass rate','Gap to target','Status']} rows={rows.map(r=>{const v=r.passed/r.attempts*100;return [<span className="record-course"><b>{r.code}</b><small>{r.name}</small></span>,`Year ${r.year}`,r.attempts,r.passed,<b>{percent(v)}</b>,<span className={v>=85?'course-gap-positive':'course-gap-negative'}>{v>=85?'+':''}{(v-85).toFixed(1)} pts</span>,<Status value={v}/>]})}/>
      <p className="course-panel-note">Counts refer to graded attempts, not unique students.</p>
    </Card>
  </div>;
}
