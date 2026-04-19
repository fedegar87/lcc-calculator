"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { BookOpen, GraduationCap, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/citations";
import type { LCCDomain } from "@/components/shared/icon-badge";

type AccentTheme = {
  iconTile: string;
  numberChip: string;
  yearBadge: string;
  link: string;
  border: string;
};

const ACCENT_THEMES: Record<LCCDomain, AccentTheme> = {
  fin: {
    iconTile: "bg-fin-100 text-fin-600",
    numberChip: "bg-fin-50 text-fin-700 ring-fin-200/60",
    yearBadge: "bg-fin-50 text-fin-700 ring-fin-200/60",
    link: "text-fin-700 hover:text-fin-600",
    border: "border-fin-100",
  },
  construction: {
    iconTile: "bg-construction-100 text-construction-600",
    numberChip:
      "bg-construction-50 text-construction-700 ring-construction-200/60",
    yearBadge:
      "bg-construction-50 text-construction-700 ring-construction-200/60",
    link: "text-construction-700 hover:text-construction-600",
    border: "border-construction-100",
  },
  nrg: {
    iconTile: "bg-nrg-100 text-nrg-600",
    numberChip: "bg-nrg-50 text-nrg-700 ring-nrg-200/60",
    yearBadge: "bg-nrg-50 text-nrg-700 ring-nrg-200/60",
    link: "text-nrg-700 hover:text-nrg-600",
    border: "border-nrg-100",
  },
  pv: {
    iconTile: "bg-pv-100 text-pv-700",
    numberChip: "bg-pv-50 text-pv-700 ring-pv-200/60",
    yearBadge: "bg-pv-50 text-pv-700 ring-pv-200/60",
    link: "text-pv-700 hover:text-pv-600",
    border: "border-pv-100",
  },
  mnt: {
    iconTile: "bg-mnt-100 text-mnt-600",
    numberChip: "bg-mnt-50 text-mnt-700 ring-mnt-200/60",
    yearBadge: "bg-mnt-50 text-mnt-700 ring-mnt-200/60",
    link: "text-mnt-700 hover:text-mnt-600",
    border: "border-mnt-100",
  },
  res: {
    iconTile: "bg-res-100 text-res-600",
    numberChip: "bg-res-50 text-res-700 ring-res-200/60",
    yearBadge: "bg-res-50 text-res-700 ring-res-200/60",
    link: "text-res-700 hover:text-res-600",
    border: "border-res-100",
  },
  inc: {
    iconTile: "bg-inc-100 text-inc-600",
    numberChip: "bg-inc-50 text-inc-700 ring-inc-200/60",
    yearBadge: "bg-inc-50 text-inc-700 ring-inc-200/60",
    link: "text-inc-700 hover:text-inc-600",
    border: "border-inc-100",
  },
};

export interface Assumption {
  /** Headline rule, e.g. "Maintenance is computed at the nominal rate". */
  rule: string;
  /** Why the rule is in place (short). */
  rationale: string;
  /** Optional citation id from `ALL_CITATIONS`. */
  citationId?: string;
}

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  domain: LCCDomain;
  citations: Citation[];
  assumptions?: Assumption[];
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isDoi(link: string) {
  return /^https?:\/\/(dx\.)?doi\.org\//i.test(link);
}

export function ReferenceModal({
  isOpen,
  onClose,
  title,
  domain,
  citations,
  assumptions,
}: ReferenceModalProps) {
  const accent = ACCENT_THEMES[domain];
  const modalRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusable = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));

    const focusFirst = () => {
      getFocusable()[0]?.focus();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || active === modalRef.current) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const raf = window.requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-modal-title"
    >
      <div
        ref={modalRef}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 animate-scale-in dark:bg-slate-900 dark:ring-slate-800"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                accent.iconTile,
              )}
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="reference-modal-title"
                className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {citations.length} peer-reviewed source
                {citations.length === 1 ? "" : "s"}
                {assumptions?.length
                  ? ` · ${assumptions.length} engine assumption${assumptions.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {assumptions?.length ? (
            <section className="mb-6">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Engine assumptions
              </h3>
              <ul className="space-y-2">
                {assumptions.map((a, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-xl border bg-slate-50/50 p-3 text-sm dark:bg-slate-800/40",
                      accent.border,
                    )}
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {a.rule}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {a.rationale}
                    </p>
                    {a.citationId ? (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Source key: <code>{a.citationId}</code>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            {assumptions?.length ? (
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                References
              </h3>
            ) : null}
            <ol className="space-y-4">
              {citations.map((c, i) => (
                <li key={c.id} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1",
                      accent.numberChip,
                    )}
                  >
                    {i + 1}
                  </span>
                  <article className="flex-1">
                    <header className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
                        {c.title}
                      </h4>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ring-1",
                          accent.yearBadge,
                        )}
                      >
                        {c.year}
                      </span>
                    </header>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {c.authors}
                      <span className="mx-1.5 text-slate-300">·</span>
                      <em className="text-slate-500 dark:text-slate-400">
                        {c.publication}
                      </em>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      {c.description}
                    </p>
                    {c.fullCitation || c.link ? (
                      <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                        {c.fullCitation ? (
                          <p className="font-mono">{c.fullCitation}</p>
                        ) : null}
                        {c.link ? (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "mt-1 inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline",
                              accent.link,
                            )}
                          >
                            {isDoi(c.link)
                              ? `DOI: ${c.link.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`
                              : "View source"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="flex items-center gap-2 border-t border-slate-100 px-6 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>
            All models implemented from peer-reviewed literature and EU
            standards.
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
