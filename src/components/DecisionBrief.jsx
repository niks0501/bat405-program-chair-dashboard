import React, { useEffect, useMemo, useRef, useState } from 'react';
import { dataset, percent, terms, kpiGuide } from '../data.js';

const ordinal = s => (s === '1' ? '1st' : '2nd');
const gapText = (v, t) => (v == null ? 'No data' : `${Math.abs(v - t).toFixed(1)} pts ${v >= t ? 'above' : 'below'}`);
const statusOf = (v, t) => (v == null ? 'No data' : v >= t ? 'On track' : v >= t - 5 ? 'Watch' : 'At risk');

export function buildBrief(filters) {
  const { ay, sem, cohort, dept = 'all' } = filters;
  const d = dataset(ay, sem, cohort, dept);
  const prev = d.term > 0 ? dataset(String(2023 + Math.floor((d.term - 1) / 2)), String((d.term - 1) % 2 + 1), cohort, dept) : null;
  const scope = `AY ${ay}–${Number(ay) + 1}, ${ordinal(sem)} semester, ${cohort === 'all' ? 'all batches' : 'Batch ' + cohort}, ${dept === 'all' ? 'all departments' : dept}`;
  const rows = d.metrics.map(m => {
    const before = prev?.metrics.find(p => p.key === m.key)?.value;
    return { ...m, status: statusOf(m.value, m.target), change: m.value != null && before != null ? m.value - before : null };
  });
  const off = rows.filter(m => m.value != null && m.value < m.target).sort((a, b) => (b.target - b.value) - (a.target - a.value));
  const onTrack = rows.filter(m => m.value != null && m.value >= m.target);
  const lowCourses = d.rows.filter(r => r.passed / r.attempts * 100 < 85).sort((a, b) => a.passed / a.attempts - b.passed / b.attempts);
  const lowBatches = d.cohorts.filter(r => r.enrolled / r.eligible * 100 < 90).sort((a, b) => a.enrolled / a.eligible - b.enrolled / b.eligible);
  const suppressed = d.sections.filter(s => s.valid < 10).length;

  const findings = [`${onTrack.length} of ${rows.length} indicators meet their targets.`];
  if (off[0]) findings.push(`The largest gap is ${off[0].label} at ${percent(off[0].value)}, ${gapText(off[0].value, off[0].target)} its ${off[0].target}% target.`);
  if (lowCourses.length) findings.push(`${lowCourses.length} of ${d.rows.length} courses are below the 85% pass-rate target, lowest: ${lowCourses.slice(0, 3).map(r => `${r.code} (${percent(r.passed / r.attempts * 100)})`).join(', ')}.`);
  if (lowBatches.length) findings.push(`${lowBatches.length} of ${d.cohorts.length} batches are below the 90% retention target, lowest: ${lowBatches.slice(0, 3).map(r => `Batch ${r.cohort} (${percent(r.enrolled / r.eligible * 100)})`).join(', ')}.`);
  if (!off.length) findings.push('No indicator is below target in this scope.');

  const interpretation = rows.map(m => {
    const move = m.change == null ? 'no prior-term comparison is available' : Math.abs(m.change) < 0.05 ? 'unchanged from the prior term' : `${m.change > 0 ? 'up' : 'down'} ${Math.abs(m.change).toFixed(1)} pts from the prior term`;
    return `${m.label}: ${m.value == null ? 'no data for this scope' : m.value >= m.target ? `meets the ${m.target}% target (${gapText(m.value, m.target)})` : `${gapText(m.value, m.target)} the ${m.target}% target, ${m.status.toLowerCase()}`}; ${move}.`;
  });

  const actions = off.map(m => {
    let extra = '';
    if (m.key === 'pass' && lowCourses.length) extra = ` Start with ${lowCourses.slice(0, 3).map(r => r.code).join(', ')}.`;
    if (m.key === 'retention' && lowBatches.length) extra = ` Start with ${lowBatches.slice(0, 2).map(r => 'Batch ' + r.cohort).join(' and ')}.`;
    return `${m.label} (${m.period.toLowerCase()}): ${kpiGuide[m.key].decision}${extra}`;
  });
  if (!actions.length) actions.push('No follow-up is required. Keep monitoring at the usual review periods.');

  const limits = [
    'One term of change is not enough to establish a reliable trend.',
    `SETE participation is ${percent(rows.find(m => m.key === 'response').value)} against a 70% target${rows.find(m => m.key === 'response').value < 70 ? ', so scores may not represent every eligible student' : ''}.`,
    'The SETE formula, instrument and benchmarks need institutional verification before official use.',
    'Figures come from the aggregate records in this dashboard. No student or instructor identities are included.',
  ];
  if (suppressed) limits.splice(2, 0, `${suppressed} section${suppressed === 1 ? '' : 's'} with fewer than 10 valid responses ${suppressed === 1 ? 'is' : 'are'} suppressed.`);
  if (!d.cohorts.length) limits.splice(2, 0, 'No batch has an eligible continuing population in this term, so retention cannot be computed.');

  return { title: 'Program decision brief', scope, term: terms[d.term], purpose: 'Show which BSIT outcomes are off target for the selected term and what the Program Chair should follow up.', evidence: rows, findings, interpretation, actions, limits };
}

export function briefText(b) {
  const list = a => a.map((x, i) => `${i + 1}. ${x}`).join('\n');
  return [
    `${b.title.toUpperCase()}`, `Scope: ${b.scope}`, '',
    'PURPOSE', b.purpose, '',
    'KEY FINDINGS', list(b.findings), '',
    'EVIDENCE', ...b.evidence.map(m => `- ${m.label}: ${percent(m.value)} (target ${m.target}%, ${m.status})`), '',
    'INTERPRETATION', list(b.interpretation), '',
    'DECISION IMPLICATIONS', list(b.actions), '',
    'LIMITATIONS', list(b.limits),
  ].join('\n');
}

export default function DecisionBrief({ filters, onClose }) {
  const brief = useMemo(() => buildBrief(filters), [filters]);
  const [copied, setCopied] = useState(false);
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus();
    const key = e => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', key);
    return () => { removeEventListener('keydown', key); previous?.focus?.(); };
  }, [onClose]);
  async function copy() {
    try { await navigator.clipboard.writeText(briefText(brief)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  }
  const Section = ({ n, title, children }) => <section className="brief-section"><h3><span>{n}</span>{title}</h3>{children}</section>;
  return <div className="brief-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="brief-panel" role="dialog" aria-modal="true" aria-labelledby="brief-title" tabIndex="-1" ref={panel}>
      <div className="brief-actions">
        <button type="button" onClick={() => print()}>Print or save as PDF</button>
        <button type="button" onClick={copy} role="status">{copied ? 'Copied' : 'Copy as text'}</button>
        <button type="button" className="brief-close" onClick={onClose} aria-label="Close decision brief">&times;</button>
      </div>
      <div className="brief-head">
        <p className="eyebrow">BSIT INSIGHTS · DECISION BRIEF</p>
        <h2 id="brief-title">{brief.title}</h2>
        <p className="brief-scope"><b>Scope:</b> {brief.scope}</p>
      </div>
      <Section n="1" title="Purpose"><p>{brief.purpose}</p></Section>
      <Section n="2" title="Key findings"><ul>{brief.findings.map(x => <li key={x}>{x}</li>)}</ul></Section>
      <Section n="3" title="Evidence"><div className="brief-table-wrap"><table className="brief-table"><thead><tr><th>Indicator</th><th>Actual</th><th>Target</th><th>Gap</th><th>vs prior term</th><th>Status</th></tr></thead><tbody>{brief.evidence.map(m => <tr key={m.key}><td>{m.label}</td><td>{percent(m.value)}</td><td>{m.target}%</td><td>{m.value == null ? '–' : `${m.value >= m.target ? '+' : '−'}${Math.abs(m.value - m.target).toFixed(1)} pts`}</td><td>{m.change == null ? '–' : `${m.change >= 0 ? '+' : '−'}${Math.abs(m.change).toFixed(1)} pts`}</td><td><span className={'status ' + m.status.toLowerCase().replaceAll(' ', '-')}>{m.status}</span></td></tr>)}</tbody></table></div></Section>
      <Section n="4" title="Interpretation"><ul>{brief.interpretation.map(x => <li key={x}>{x}</li>)}</ul></Section>
      <Section n="5" title="Decision implications"><ol>{brief.actions.map(x => <li key={x}>{x}</li>)}</ol></Section>
      <Section n="6" title="Limitations"><ul>{brief.limits.map(x => <li key={x}>{x}</li>)}</ul></Section>
    </div>
  </div>;
}
