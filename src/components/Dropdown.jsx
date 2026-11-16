import React, { useEffect, useRef, useState } from 'react';

export default function Dropdown({ label, value, options, onChange, changed = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const id = React.useId();
  const selected = options.findIndex(option => option.value === value);
  useEffect(() => {
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (open) list.current?.focus(); }, [open]);
  function show() { setActive(Math.max(0, selected)); setOpen(true); }
  function choose(index) { onChange(options[index].value); setOpen(false); trigger.current?.focus(); }
  function keys(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show();
      else setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    else if (event.key === 'Home' && open) { event.preventDefault(); setActive(0); }
    else if (event.key === 'End' && open) { event.preventDefault(); setActive(options.length - 1); }
    else if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); choose(active); }
  }
  return <div className={'filter-dropdown' + (changed ? ' filter-changed' : '')} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span className="dropdown-label" id={id + '-label'}>{label}</span>
    <button type="button" ref={trigger} className={'dropdown-trigger' + (open ? ' is-open' : '')} aria-haspopup="listbox" aria-expanded={open} aria-controls={id + '-list'} aria-labelledby={id + '-label ' + id + '-value'} onClick={() => open ? setOpen(false) : show()} onKeyDown={keys}>
      <span id={id + '-value'}>{options[selected]?.label}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
    </button>
    {open && <ul id={id + '-list'} className="dropdown-options" role="listbox" tabIndex={-1} aria-labelledby={id + '-label'} aria-activedescendant={id + '-option-' + active} ref={list} onKeyDown={keys}>
      {options.map((option, index) => <li id={id + '-option-' + index} key={option.value} role="option" aria-selected={option.value === value} className={index === active ? 'option-active' : ''} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}><span>{option.label}</span>{option.value === value && <span className="option-check" aria-hidden="true">✓</span>}</li>)}
    </ul>}
  </div>;
}
