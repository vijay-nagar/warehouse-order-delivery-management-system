import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus the first meaningful field in the dialog body, not the close
    // button — the close button renders first in DOM order (inside
    // <header>, before the body), so a body-wide query would always match
    // it first. Fall back to the close button only if the body has nothing
    // focusable (e.g. a read-only detail dialog).
    const firstBodyField = document.querySelector<HTMLElement>(
      '.dialog-body button:not([disabled]), .dialog-body input:not([disabled]), .dialog-body textarea:not([disabled]), .dialog-body select:not([disabled]), .dialog-body [tabindex]:not([tabindex="-1"])',
    );
    (firstBodyField ?? document.querySelector<HTMLElement>('.dialog button:not([disabled])'))?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>('.dialog button:not([disabled]), .dialog input:not([disabled]), .dialog textarea:not([disabled]), .dialog select:not([disabled]), .dialog [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header><div className="dialog-body">{children}</div></section></div>;
}
