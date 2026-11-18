import React, { useState } from 'react';
import FloatingTooltip from './FloatingTooltip.jsx';
import {percent,terms} from '../data.js';
export function Status({value,target=85}){const status=value==null?'No data':value>=target?'On track':value>=target-5?'Watch':'At risk';return <span className={'status '+status.toLowerCase().replaceAll(' ','-')}>{status}</span>}
export function Card({title,subtitle,children,action,className=''}){return <section className={'card '+className}><div className="card-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>}
export function Metrics({metrics,previous,onSelect,compare=false}) {
  return <div className="metrics">{metrics.map(m=>{
    const prior=previous?.find(p=>p.key===m.key)?.value;
    const delta=m.value!=null&&prior!=null?m.value-prior:null;
    const unchanged=delta!=null&&Math.abs(delta)<0.05;
    const tone=m.value==null?'none':m.value>=m.target?'ok':m.value>=m.target-5?'watch':'risk';
    return <button className={'metric metric-'+m.key+' metric-tone-'+tone} key={m.key} onClick={()=>onSelect(m.key)}>
      <div className="metric-top"><span>{m.label}</span>{m.badge?<span className={'status '+m.badgeTone}>{m.badge}</span>:<Status value={m.value} target={m.target}/>}</div>
      <div className="metric-value-row"><strong>{m.displayValue??percent(m.value)}</strong></div>
      {compare&&<span className={'metric-trend '+(m.changeLabel?'neutral':delta==null||unchanged?'neutral':delta>0?'positive':'negative')}>{m.changeLabel??(delta==null?'No prior-term data':unchanged?'No change vs prior term':`${delta>0?'+':''}${delta.toFixed(1)} pts vs prior term`)}</span>}
      <small>{m.targetLabel??`Target ${m.target}%`}</small><p>{m.note}</p><span className="metric-link">View records <span className="metric-link-arrow" aria-hidden="true">&rarr;</span></span>
    </button>;
  })}</div>;
}
export function Table({headers,rows}){return <div className="table-wrap" tabIndex="0" aria-label="Scrollable data table"><table><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((cell,j)=><td key={j}>{cell}</td>)}</tr>):<tr><td colSpan={headers.length}>No data for this selection.</td></tr>}</tbody></table></div>}
export function Chart({series,selected,onSelect,min=70,max=100,target}) {
  const [hover,setHover]=useState(null);
  const [cursor,setCursor]=useState(null);
  const x=i=>50+i*126,y=v=>200-(v-min)/(max-min)*170;
  const colors=['#2b6cb0','#7fa8d4','#a9c4e2','#5b7392'];
  const mark=(v)=>target==null||v>=target?'ok':v>=target-5?'watch':'risk';
  const statusColor={ok:null,watch:'#d69e2e',risk:'#b1263b'};
  const index=hover;
  return <><div className="interactive-chart" onMouseLeave={()=>{setHover(null);setCursor(null);}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setHover(null)}}>
    {index!=null&&cursor&&<FloatingTooltip key={index} x={cursor.x} y={cursor.y}><strong>{terms[index]}</strong>{series.map(s=><span key={s.label}>{s.label}: <b>{percent(s.values[index])}</b></span>)}</FloatingTooltip>}
    <svg className="chart" viewBox="-22 0 764 240" role="group" aria-label="Interactive term trend chart">
      <rect x={x(selected)-12} y="20" width="24" height="180" rx="6" fill="#eef4fb"/>
      {[min,(min+max)/2,max].map(v=><g key={v}><line x1="50" x2="680" y1={y(v)} y2={y(v)} stroke="#e5e7eb"/><text x="36" y={y(v)+4} textAnchor="end">{v}%</text></g>)}
      {target!=null&&<g><line x1="50" x2="680" y1={y(target)} y2={y(target)} stroke="#9ca3af" strokeDasharray="5 5"/><text x="680" y={y(target)-8} textAnchor="end">Target {target}%</text></g>}
      {index!=null&&<line x1={x(index)} x2={x(index)} y1="20" y2="200" stroke="#6b7280" strokeDasharray="3 4"/>}
      {series.map((s,k)=><g key={s.label}><polyline pathLength="1000" fill="none" stroke={colors[k%4]} strokeWidth="3" strokeDasharray={k===1?'7 4':k===2?'2 4':k===3?'9 3 2 3':undefined} points={s.values.map((v,i)=>v==null?null:`${x(i)},${y(v)}`).filter(Boolean).join(' ')}/>{s.values.map((v,i)=>{if(v==null)return null;const st=mark(v),c=statusColor[st]||colors[k%4],r=index===i?6:4,sw=index===i?3:2,cx=x(i),cy=y(v);
        if(st==='watch')return <polygon key={i} points={`${cx},${cy-r-1.5} ${cx+r+1.5},${cy} ${cx},${cy+r+1.5} ${cx-r-1.5},${cy}`} fill="white" stroke={c} strokeWidth={sw}/>;
        if(st==='risk')return <polygon key={i} points={`${cx},${cy-r-1.5} ${cx+r+1.5},${cy+r} ${cx-r-1.5},${cy+r}`} fill="white" stroke={c} strokeWidth={sw}/>;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="white" stroke={c} strokeWidth={sw}/>;})}</g>)}
      {terms.map((t,i)=><text key={t} x={x(i)} y="228" textAnchor="middle">{t}</text>)}
      {terms.map((t,i)=><rect key={t} x={x(i)-42} y="16" width="84" height="190" rx="4" fill="transparent" className="chart-hit-area" role="button" tabIndex={0} aria-label={`${t}. ${series.map(s=>s.label+' '+percent(s.values[i])).join(', ')}. Apply this term.`} onMouseEnter={event=>{setHover(i);setCursor({x:event.clientX,y:event.clientY});}} onFocus={event=>{const rect=event.currentTarget.getBoundingClientRect();setHover(i);setCursor({x:rect.left+rect.width/2,y:rect.top});}} onClick={()=>onSelect(i)} onKeyDown={event=>{if(event.key==='Escape')setHover(null);if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(i);}}}/>)}
    </svg>
  </div><div className="chart-legend">{series.map((s,i)=><span key={s.label}><i style={{background:colors[i%4]}}/>{s.label}</span>)}</div><div className="term-buttons" aria-label="Choose chart term">{terms.map((t,i)=><button key={t} className={i===selected?'selected':''} aria-pressed={i===selected} onClick={()=>onSelect(i)}>{t}</button>)}</div></>;
}
