export const courses = [
  ['IT 111','Introduction to Computing',1,126,111],
  ['IT 112','Computer Programming 1',1,118,88],
  ['IT 211','Data Structures and Algorithms',2,104,82],
  ['IT 212','Database Management Systems',2,101,87],
  ['IT 311','Systems Analysis and Design',3,92,84],
  ['IT 312','Web Systems and Technologies',3,90,81],
  ['IT 313','Networking 2',3,88,73],
  ['IT 411','Capstone Project 1',4,84,80],
  ['IT 412','Social and Professional Issues',4,83,76],
];
export const terms = ['23–24 · 1st','23–24 · 2nd','24–25 · 1st','24–25 · 2nd','25–26 · 1st','25–26 · 2nd'];
export const retention = [
  { cohort:'2022', eligible:110, enrolled:101, trend:[93.5,92.1,94,92.8,93.6,91.8] },
  { cohort:'2023', eligible:131, enrolled:117, trend:[null,91,89.8,92.2,90.1,89.3] },
  { cohort:'2024', eligible:121, enrolled:106, trend:[null,null,null,90.2,88.9,87.6] },
  { cohort:'2025', eligible:140, enrolled:128, trend:[null,null,null,null,null,91.4] },
];
export const scoreTrend=[82.4,81.9,83.1,82,80.6,79.4];
export function dataset(ay,sem,cohort){
  const term=(Number(ay)-2023)*2+Number(sem)-1;
  const rows=courses.filter(c=>cohort==='all'||c[2]===Number(ay)-Number(cohort)+1).map(([code,name,year,attempts,passed],i)=>({code,name,year,attempts,passed:Math.min(attempts,Math.max(0,passed+(5-term)*((i%3)-1)))}));
  const cohorts=retention.filter(r=>(cohort==='all'||r.cohort===cohort)&&r.trend[term]!=null).map(r=>({...r,enrolled:Math.round(r.eligible*r.trend[term]/100)}));
  const sum=(arr,key)=>arr.reduce((n,r)=>n+r[key],0);
  const attempts=sum(rows,'attempts'),passed=sum(rows,'passed'),eligible=sum(cohorts,'eligible'),enrolled=sum(cohorts,'enrolled');
  const submitted=[46,46,48,46,47,45][term],expected=[46,47,48,47,48,48][term];
  const sections=courses.slice(0,8).map(([code],i)=>{const eligible=30+i*3;const valid=Math.round(eligible*([.74,.71,.76,.69,.72,.64][term]+(i%3-1)*.04));return {code:code+' · '+String.fromCharCode(65+i%3),eligible,valid,score:scoreTrend[term]+(i%3-1)*1.4}});
  const valid=sum(sections,'valid'),evaluations=sum(sections,'eligible');
  const teaching=sections.reduce((n,r)=>n+r.valid*r.score,0)/valid;
  const withGuide=m=>({...m,decision:kpiGuide[m.key].decision,period:kpiGuide[m.key].period});
  return {term,rows,cohorts,attempts,passed,eligible,enrolled,submitted,expected,sections,valid,evaluations,teaching,metrics:[{key:'pass',label:'Course pass rate',value:attempts?passed/attempts*100:null,target:85,note:`${passed} of ${attempts} finalized attempts passed`},{key:'retention',label:'Student retention',value:eligible?enrolled/eligible*100:null,target:90,note:`${enrolled} of ${eligible} eligible students continued`},{key:'grades',label:'Grade submission',value:submitted/expected*100,target:100,note:`${submitted} of ${expected} grade sets on time`},{key:'teaching',label:'SETE effectiveness',value:teaching,target:80,note:`Weighted by ${valid} valid responses`},{key:'response',label:'SETE response',value:valid/evaluations*100,target:70,note:`${valid} of ${evaluations} eligible evaluations`}].map(withGuide)};
}
export const kpiGuide={
  pass:{objective:'Students pass the courses they attempt',target:85,data:'Finalized grades per course',decision:'Review below-target courses with their course teams and plan academic support.',period:'Every semester'},
  retention:{objective:'Students continue into the next term',target:90,data:'Eligible prior-term students and re-enrollment',decision:'Ask advisers to look into batches below target and find what keeps students from continuing.',period:'Every semester'},
  grades:{objective:'Grades are submitted on time',target:100,data:'Expected and on-time grade sets',decision:'Follow up late grade submissions with the instructors concerned.',period:'Each grading period'},
  teaching:{objective:'Teaching is evaluated as effective',target:80,data:'SETE section scores and valid responses',decision:'Discuss low-scoring sections with their instructors. Do not use scores to rank instructors.',period:'Every semester'},
  response:{objective:'Enough students complete the evaluation',target:70,data:'Valid responses and eligible evaluations',decision:'Raise participation before relying on SETE scores.',period:'Each evaluation period'},
};
export const percent=v=>v==null?'No data':v.toFixed(1)+'%';

export function matchesStatus(value, target, status = 'all') {
  if (status === 'all') return true;
  if (value == null || !Number.isFinite(value)) return false;
  const result = value >= target ? 'on-track' : value >= target - 5 ? 'watch' : 'at-risk';
  return result === status;
}
