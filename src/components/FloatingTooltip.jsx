import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function FloatingTooltip({ x, y, children }) {
  const tip = useRef(null);
  useLayoutEffect(() => {
    let frame = 0;
    const place = (px, py) => {
      const node = tip.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      const left = Math.max(8, Math.min(px + 14, window.innerWidth - box.width - 8));
      const top = py + box.height + 18 > window.innerHeight ? Math.max(8, py - box.height - 14) : py + 16;
      node.style.left = left + 'px';
      node.style.top = top + 'px';
    };
    place(x, y);
    const move = event => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => place(event.clientX, event.clientY));
    };
    const hide = () => { if (tip.current) tip.current.style.visibility = 'hidden'; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [x, y]);
  return createPortal(<div ref={tip} role="tooltip" className="floating-detail-tooltip">{children}</div>, document.body);
}
