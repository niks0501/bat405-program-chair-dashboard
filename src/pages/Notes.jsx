import React from 'react';
import { Card, Table } from '../components/UI.jsx';
import { kpiGuide } from '../data.js';

const definitions = [
  ['Course pass rate','Passed finalized attempts / eligible finalized attempts × 100','85%','An attempt is a course registration with a finalized grade, not a unique student.'],
  ['Student retention','Continuing enrolled students / eligible prior-term students × 100','90%','Continuation does not explain why students transferred, paused or did not enroll again.'],
  ['Grade submission','On-time course-section grade sets / expected grade sets × 100','100%','This view provides a program summary, not individual submission histories.'],
  ['SETE effectiveness','Sum of section score × valid responses / total valid responses','80%','A response-weighted score. Read with participation and other evidence.'],
  ['SETE participation','Valid completed evaluations / eligible evaluations × 100','70%','Counts refer to eligible evaluations, not necessarily unique respondents.'],
];
const sections=[['definitions','Metric definitions'],['benchmarks','Benchmarks & status'],['scope','Filter scope'],['limitations','Data & limitations']];
export default function Notes(){
  function jump(id){document.getElementById('notes-'+id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
  return <div className="data-notes-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">DATA REFERENCE</span><h2>Know what the numbers mean.</h2><p>Definitions, scope and limitations to support a more informed review.</p></div><span className="courses-benchmark">Data source <b>Illustrative sample</b></span></div>
    <div className="notes-disclosure"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>About this data.</strong><p>All records are synthetic aggregates. Targets, SETE calculations and institutional rules need verification before official use.</p></div></div>
    <nav className="notes-navigation" aria-label="Data notes sections">{sections.map(([id,label],index)=><button key={id} onClick={()=>jump(id)}><span>{String(index+1).padStart(2,'0')}</span>{label}<span aria-hidden="true">↓</span></button>)}</nav>
    <section id="notes-definitions" className="notes-section"><Card title="Metric definitions" subtitle="The calculation behind each headline indicator" action={<span className="course-record-count">5 indicators</span>}>
      <div className="metric-definition-list">{definitions.map(([name,formula,target,note],index)=><div className="metric-definition" key={name}><span className="definition-index">{String(index+1).padStart(2,'0')}</span><div><h3>{name}</h3><p className="definition-formula">{formula}</p><p className="definition-note">{note}</p></div><span className="definition-target">Target <b>{target}</b></span></div>)}</div>
    </Card></section>
    <section className="notes-section"><Card title="Who this is for and what it decides" subtitle="Tactical dashboard for the Program Chair. Each indicator links an objective to a target, a data source and a decision." action={<span className="course-record-count">5 indicators</span>}>
      <Table headers={['Indicator','Objective','Target','Data','If off target','Review']} rows={[['Course pass rate','pass'],['Student retention','retention'],['Grade submission','grades'],['SETE effectiveness','teaching'],['SETE response','response']].map(([label,key])=>[label,kpiGuide[key].objective,kpiGuide[key].target+'%',kpiGuide[key].data,kpiGuide[key].decision,kpiGuide[key].period])}/>
      <p className="course-panel-note">Stakeholder: Program Chair, responsible for monitoring program outcomes. The decisions are follow-up actions for review, not automatic judgments about courses or instructors.</p>
    </Card></section>
    <div className="notes-two-column">
      <section id="notes-benchmarks" className="notes-section"><Card title="Benchmarks & status" subtitle="Thresholds used throughout the dashboard">
        <div className="benchmark-status-list"><div><span className="status on-track">On track</span><p>Meets or exceeds the metric target.</p></div><div><span className="status watch">Watch</span><p>Below target by up to 5 percentage points.</p></div><div><span className="status at-risk">At risk</span><p>More than 5 percentage points below target.</p></div><div><span className="status no-data">No data</span><p>No eligible population, unavailable term or suppressed score.</p></div></div>
        <p className="course-panel-note">These are review prompts, not institutional determinations. Percentage-point changes compare the same metric across adjacent terms.</p>
      </Card></section>
      <section id="notes-scope" className="notes-section"><Card title="Filter scope" subtitle="What changes when you adjust the controls">
        <div className="notes-scope-list">{[
          ['Academic year & semester','Select the reporting term for every page.'],
          ['Batch','The group of students who entered the program in the same year (for example, Batch 2024). Applies to courses and retention. Grade submission and SETE remain program-wide.'],
          ['Status','Filters displayed indicators and records by their respective metric target. Summary totals may retain the full scope; each page labels this.'],
          ['Search & sort','Apply to the current page or record category. Local counts and exports follow the displayed results.'],
        ].map(([title,body])=><div key={title}><strong>{title}</strong><p>{body}</p></div>)}</div>
      </Card></section>
    </div>
    <section id="notes-limitations" className="notes-section"><Card title="Data & limitations" subtitle="Important context before interpreting or exporting results">
      <div className="notes-accordions">{[
        ['Teaching evaluation and score suppression','A section with fewer than 10 valid responses displays “Suppressed” instead of its score. Low participation can limit representativeness. Program scores are response-weighted; the official instrument, conversion and aggregation rules are not verified. Do not use this dashboard for automatic instructor rankings or personnel actions.'],
        ['Synthetic records and batch availability','All values are generated from local sample records. Some early terms have no eligible continuing population for newer batches. Batch-to-year assignment is simplified. These records are not a verified historical student dataset.'],
        ['Counts, rounding and comparisons','Percentages are computed from the displayed counts and rounded to one decimal place. Weighted rates use total counts rather than an average of percentages. “Did not continue” is a count, not an explanation. No prior-term comparison is shown when the comparison population is unavailable.'],
        ['Browser storage and CSV exports','Filter selections persist in the current browser tab. The app has no backend, account system, database or connection to university records. CSV files are generated in the browser from the active record category, filters, search and sort. No student or instructor identities are included.'],
        ['Before using real institutional data','Confirm data ownership, authorized access, current metric definitions, approved benchmarks, evaluation suppression rules and the official SETE calculation with the responsible university offices. A production system would require appropriate permissions and data controls.'],
      ].map(([title,body])=><details key={title}><summary>{title}<span aria-hidden="true">+</span></summary><p>{body}</p></details>)}</div>
    </Card></section>
    <div className="notes-closing"><span>BSIT Insights</span><p>Use the indicators to ask better questions, then review the underlying context.</p><button onClick={()=>{document.getElementById('records')?.scrollIntoView({behavior:'smooth'});}}>Browse records <span aria-hidden="true">↗</span></button></div>
  </div>;
}
