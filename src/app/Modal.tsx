import {
  type KeyboardEvent,
  type PropsWithChildren,
  useEffect,
  useId,
  useRef,
} from "react";
import styles from "./App.module.css";

interface ModalProps extends PropsWithChildren {
  readonly title: string;
  readonly eyebrow?: string;
  readonly wide?: boolean;
  readonly dismissLabel?: string;
  readonly onClose?: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  title,
  eyebrow,
  wide = false,
  dismissLabel = "Close",
  onClose,
  children,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = panelRef.current?.closest('[data-modal-backdrop]');
    const oldInert = new Map<HTMLElement, boolean>();
    const branches: Array<{ parent: HTMLElement; child: Element }> = [];
    let child = root;
    while (child?.parentElement) {
      const parent = child.parentElement;
      branches.push({ parent, child });
      if (parent === document.body) break;
      child = parent;
    }
    const containBackground = () => {
      for (const { parent, child } of branches) for (const sibling of parent.children) {
        if (sibling === child || sibling.hasAttribute('data-modal-backdrop')) continue;
        const element = sibling as HTMLElement;
        if (!oldInert.has(element)) oldInert.set(element, element.inert);
        element.inert = true;
      }
    };
    containBackground();
    const observer = new MutationObserver(containBackground);
    for (const { parent } of branches) observer.observe(parent, { childList: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      observer.disconnect();
      for (const [element, inert] of oldInert) element.inert = inert;
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && onClose !== undefined) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    } else if (!event.shiftKey && document.activeElement === panelRef.current) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      data-modal-backdrop="true"
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={panelRef}
        className={`${styles.modal} ${wide ? styles.modalWide : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.modalHeader}>
          <div>
            {eyebrow !== undefined && (
              <p className={styles.eyebrow}>{eyebrow}</p>
            )}
            <h2 id={titleId}>{title}</h2>
          </div>
          {onClose !== undefined && (
            <button
              className={styles.iconButton}
              type="button"
              onClick={onClose}
              aria-label={dismissLabel}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </header>
        <div className={styles.modalBody} role="region" aria-label={`${title} content`} tabIndex={0}>{children}</div>
      </div>
    </div>
  );
}
