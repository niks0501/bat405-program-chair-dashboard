import React, { useState } from 'react';
import { Card, Chart, Table, Status, Metrics } from '../components/UI.jsx';
import { dataset, percent, terms } from '../data.js';

export default function Teaching({ data, onTerm, onSelect }) {
  const [mode, setMode] = useState('score');
  const [selectedCode, setSelectedCode] = useState(null);
  const snapshots=Array.from({length:6},(_,i)=>dataset(String(2023+Math.floor(i/2)),String(i%2+1),'all'));
  const full=snapshots[data.term];
  const participation=full.valid/full.evaluations*100;
  const rows=[...data.sections].sort((a,b)=>a.valid/a.eligible-b.valid/b.eligible);
  const selected=rows.find(r=>r.code===selectedCode)||rows[0];
  const low=full.sections.filter(r=>r.valid/r.eligible*100<70);
  const published=full.sections.filter(r=>r.valid>=10);
  const scoreMode=mode==='score';
  const prior=snapshots[data.term-1];
  const historyLow=snapshots.map(d=>d.sections.filter(r=>r.valid/r.eligible*100<70).length);
  const historyPublished=snapshots.map(d=>d.sections.filter(r=>r.valid>=10).length);
  const countChange=(arr)=>!prior?'No prior-term data':arr[data.term]===arr[data.term-1]?'No change vs prior term':`${arr[data.term]-arr[data.term-1]>0?'+':''}${arr[data.term]-arr[data.term-1]} sections vs prior term`;
  const summary=[
    {key:'teaching',label:'Weighted SETE score',value:full.teaching,target:80,note:`Weighted by ${full.valid} valid responses`,trend:snapshots.map(d=>d.teaching)},
    {key:'response',label:'Evaluation participation',value:participation,target:70,note:`${full.valid} of ${full.evaluations} eligible evaluations`,trend:snapshots.map(d=>d.valid/d.evaluations*100)},
    {key:'below',label:'Low-participation sections',value:low.length/full.sections.length*100,target:100,displayValue:String(low.length),badge:'Review',badgeTone:'watch',showTarget:false,targetLabel:'Below the 70% response target',note:`${full.sections.length} sections in the program`,trend:historyLow,changeLabel:countChange(historyLow)},
    {key:'published',label:'Publishable section scores',value:published.length/full.sections.length*100,target:100,displayValue:`${published.length} / ${full.sections.length}`,badge:'Score availability',badgeTone:'no-data',showTarget:false,targetLabel:'At least 10 valid responses',note:'Score availability, not a quality rating',trend:historyPublished,changeLabel:countChange(historyPublished)},
  ];
  return <div className="teaching-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">TEACHING & STUDENT EXPERIENCE</span><h2>Read the feedback. Understand the context.</h2><p>Explore SETE results alongside participation, with section-level context.</p></div><span className="courses-benchmark">Program-wide <b>SETE</b></span></div>
    <div className="overview-page overview-refined analytics-kpi-grid"><Metrics metrics={summary} previous={prior?[{key:'teaching',value:prior.teaching},{key:'response',value:prior.valid/prior.evaluations*100}]:undefined} compare selectedTerm={data.term} onSelect={key=>onSelect(key==='response'?'response':'teaching')}/></div>
    {participation<70&&<div className="teaching-participation-warning"><span aria-hidden="true">!</span><div><strong>Participation is below the 70% target.</strong><p>Read the score with caution. The responses may not represent every eligible student's experience.</p></div><button onClick={()=>setMode('response')}>View participation <span aria-hidden="true">↗</span></button></div>}
    <div className="teaching-analysis-grid">
      <Card title={scoreMode?'Teaching score over time':'Participation over time'} subtitle="Six-term view · full program scope" action={<div className="teaching-mode" aria-label="Evaluation chart view">{[['score','Score'],['response','Participation']].map(([key,label])=><button key={key} className={mode===key?'selected':''} aria-pressed={mode===key} onClick={()=>setMode(key)}>{label}</button>)}</div>}>
        <div className="teaching-chart-headline"><div><strong>{percent(scoreMode?full.teaching:participation)}</strong><span>{scoreMode?'Response-weighted SETE score':'Completed eligible evaluations'}</span></div><Status value={scoreMode?full.teaching:participation} target={scoreMode?80:70}/></div>
        <Chart series={[{label:scoreMode?'Weighted SETE score':'Response rate',values:snapshots.map(d=>scoreMode?d.teaching:d.valid/d.evaluations*100)}]} selected={data.term} onSelect={onTerm} min={50} target={scoreMode?80:70}/>
        <p className="course-panel-note">Select a term to update the dashboard. Batch and section-status filters do not change these program-wide summaries or trends.</p>
      </Card>
      <aside className="teaching-inspector" aria-label="Selected section details" aria-live="polite"><span className="section-kicker">SECTION SPOTLIGHT</span>{selected?<><h3>{selected.code}</h3><span className="teaching-term">{terms[data.term]}</span><div className="teaching-section-score"><strong>{selected.valid<10?'Suppressed':percent(selected.score)}</strong><span>section SETE score</span></div><Status value={selected.valid<10?null:selected.score} target={80}/><div className="teaching-response-detail"><div><span>Participation</span><b>{percent(selected.valid/selected.eligible*100)}</b></div><div className="continuation-track"><span style={{width:`${selected.valid/selected.eligible*100}%`}}/></div><p>{selected.valid} valid responses / {selected.eligible} eligible evaluations</p></div><div className="teaching-section-note"><strong>{selected.valid<10?'Score withheld':selected.valid/selected.eligible*100<70?'Limited participation':'Read with context'}</strong><p>{selected.valid<10?'Fewer than 10 valid responses. The section score is not displayed.':selected.valid/selected.eligible*100<70?'Participation is below 70%. Consider who may not have responded before interpreting the score.':'Consider response rates and other evidence when interpreting student-reported experience.'}</p></div><button className="inspector-action" onClick={()=>onSelect('teaching')}>Open evaluation records <span aria-hidden="true">↗</span></button></>:<div className="course-empty">No sections match the current status. Try All statuses.</div>}</aside>
    </div>
    <Card title="Section evaluation results" subtitle="Lowest participation first · select a section to inspect" action={<span className="course-record-count">{rows.length} sections shown</span>}>
      <Table headers={['Course / section','Eligible','Valid responses','Participation','Response status','SETE score','Score status']} rows={rows.map(r=>[<button className={'retention-table-link '+(selected?.code===r.code?'current':'')} aria-pressed={selected?.code===r.code} onClick={()=>setSelectedCode(r.code)}>{r.code}<span aria-hidden="true">↗</span></button>,r.eligible,r.valid,<b>{percent(r.valid/r.eligible*100)}</b>,<Status value={r.valid/r.eligible*100} target={70}/>,<b>{r.valid<10?'Suppressed':percent(r.score)}</b>,<Status value={r.valid<10?null:r.score} target={80}/>])}/>
      <p className="course-panel-note">Status filters section scores against the 80% target. Program summaries include all sections. Under 10 valid responses: score suppressed.</p>
    </Card>
    <div className="retention-guidance"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>Feedback is one part of the picture.</strong><p>These results support discussion, not automatic instructor rankings or personnel decisions.</p></div></div>
  </div>;
}
