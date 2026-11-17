import React, { useState } from 'react';
import { Card, Table, Status } from '../components/UI.jsx';
import Dropdown from '../components/Dropdown.jsx';
import { percent, matchesStatus, terms } from '../data.js';

export default function Records({ data, recordType, setRecordType, status, focus, cohort, dept }) {
  const batchScope = cohort === 'all' ? 'All batches' : 'Batch ' + cohort, deptScope = dept === 'all' ? 'All departments' : dept;
  const type = recordType === 'response' ? 'teaching' : recordType;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [exportMessage, setExportMessage] = useState('');
  const gradeRate = data.submitted / data.expected * 100;
  const sets = {
    pass: { label:'Course outcomes', description:'Finalized graded attempts by course.', target:85, headers:['Course code','Course name','Year level','Attempts','Passed','Pass rate','Status'], items:data.rows.map(r=>({name:r.code+' '+r.name,value:r.passed/r.attempts*100,cells:[r.code,r.name,`Year ${r.year}`,r.attempts,r.passed,percent(r.passed/r.attempts*100)]})), scope:batchScope+' · '+deptScope, note:'Attempts are course registrations with finalized grades, not unique students.' },
    retention: { label:'Batch retention',description:'Continuation from the eligible previous-term population.',target:90,headers:['Batch','Eligible prior term','Continued','Did not continue','Retention','Status'],items:data.cohorts.map(r=>({name:'Batch '+r.cohort,value:r.enrolled/r.eligible*100,cells:['Batch '+r.cohort,r.eligible,r.enrolled,r.eligible-r.enrolled,percent(r.enrolled/r.eligible*100)]})),scope:batchScope+' · All departments',note:'Retention indicates continuation, not the reasons students did not enroll again.' },
    grades: { label:'Grade submissions',description:'Program-wide submission summary for the selected term.',target:100,headers:['Record','Expected sets','On-time sets','Missed deadline','On-time rate','Status'],items:matchesStatus(gradeRate,100,status)?[{name:'Program submission summary',value:gradeRate,cells:['Program submission summary',data.expected,data.submitted,data.expected-data.submitted,percent(gradeRate)]}]:[],scope:dept==='all'?'Program-wide':deptScope,note:'This is an aggregate summary. Individual course-section submission records are not available in this sample.' },
    teaching: { label:'SETE sections',description:'Evaluation response counts and section scores.',target:80,headers:['Course / section','Eligible','Valid responses','Participation','SETE score','Score status'],items:data.sections.map(r=>({name:r.code,value:r.valid<10?null:r.score,cells:[r.code,r.eligible,r.valid,percent(r.valid/r.eligible*100),r.valid<10?'Suppressed':percent(r.score)]})),scope:dept==='all'?'Program-wide':deptScope,note:'Section scores with fewer than 10 valid responses are suppressed. Interpret scores alongside participation.' },
  };
  const current=sets[type]||sets.pass;
  const inFocus=r=>type==='pass'&&focus.course?r.name.startsWith(focus.course+' '):type==='retention'&&focus.batch?r.name==='Batch '+focus.batch:true;
  const rows=current.items.filter(r=>inFocus(r)&&r.name.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):a.value==null?b.value==null?0:1:b.value==null?-1:(sort==='highest'?-1:1)*(a.value-b.value));
  const word=v=>v==null?'No data':v>=current.target?'On track':v>=current.target-5?'Watch':'At risk';
  const onTrack=rows.filter(r=>r.value!=null&&r.value>=current.target).length;
  function category(id){setRecordType(id);setSearch('');setExportMessage('');}
  function download(){
    const csv=[current.headers,...rows.map(r=>[...r.cells,word(r.value)])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`bsit-${type}-term-${data.term+1}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setExportMessage(`${rows.length} rows prepared for CSV download.`);
  }
  return <div className="records-page courses-page">
    <div className="courses-intro"><div><span className="section-kicker">RECORDS</span><h2>The details behind every indicator.</h2><p>Browse, review and export the records for your selected term.</p></div><span className="courses-benchmark">Selected term <b>{terms[data.term]}</b></span></div>
    <div className="records-categories" aria-label="Record category">{Object.entries(sets).map(([id,set])=><button key={id} className={id===type?'is-active':''} aria-pressed={id===type} onClick={()=>category(id)}><span className="record-category-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span><span><strong>{set.label}</strong><small>{set.items.length} {id==='grades'?(set.items.length===1?'summary row':'summary rows'):(set.items.length===1?'record':'records')} available</small></span><span className="category-arrow" aria-hidden="true">↗</span></button>)}</div>
    <Card title={current.label} subtitle={current.description} action={<button className="records-export" disabled={!rows.length} onClick={download}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>Export CSV</button>}>
      <div className="records-toolbar"><label className="course-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Search current records" placeholder={type==='retention'?'Search batch…':type==='grades'?'Search summary…':'Search course code or name…'} value={search} onChange={e=>setSearch(e.target.value)}/></label><Dropdown label="Sort records" value={sort} onChange={setSort} options={[{value:'name',label:'Code / name'},{value:'lowest',label:'Lowest rate / score'},{value:'highest',label:'Highest rate / score'}]}/></div>
      <div className="records-meta" aria-live="polite"><span><b>{rows.length}</b> rows shown</span>{(type==='pass'&&focus.course||type==='retention'&&focus.batch)&&<span className="records-focus">Focused on <b>{type==='pass'?focus.course:'Batch '+focus.batch}</b> (clear it in the filter bar)</span>}<span><i className="record-dot good"/>{onTrack} on track</span><span><i className="record-dot review"/>{rows.filter(r=>r.value!=null&&r.value<current.target).length} below target</span><span className="records-scope">{current.scope}</span></div>
      <Table headers={current.headers} rows={rows.map(r=>[...r.cells,<Status value={r.value} target={current.target}/>])}/>
      <div className="records-table-footer"><span>{rows.length?`Showing all ${rows.length} matching rows`:'No matching rows. Try another search or filter.'}</span><span>Target: {current.target}%</span></div>
      <p className="course-panel-note">{current.note}</p><p className="records-download-message" role="status" aria-live="polite">{exportMessage}</p>
    </Card>

    <div className="retention-guidance"><span className="guidance-symbol" aria-hidden="true">i</span><div><strong>Your export follows the current view.</strong><p>CSV includes the active category, status filter, search and sort order. All records are aggregates; no student or instructor identities are included, and scores from sections with fewer than 10 valid responses are suppressed.</p></div></div>
  </div>;
}
