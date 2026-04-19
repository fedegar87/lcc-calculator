import { Mail, BookOpen, ExternalLink } from "lucide-react";
import { PublicationCard } from "./publication-card";

const SOCIALS = [
  {
    label: "ORCID",
    href: "https://orcid.org/0000-0001-7989-1948",
    pill: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=oU6VqgsAAAAJ",
    pill: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
  {
    label: "ResearchGate",
    href: "https://www.researchgate.net/profile/Federico-Garzia",
    pill: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
  },
  {
    label: "GitLab",
    href: "https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator",
    pill: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
];

const PUBLICATIONS = [
  {
    title:
      "Sensitivity analysis as support for reliable life cycle cost evaluation applied to eleven nearly zero-energy buildings in Europe",
    journal: "Sustainable Cities and Society (2021)",
    description:
      "Foundational paper. DSA + EE sensitivity analysis on 11 nZEBs; identifies the four parameters that drive 26% of LCC variance.",
    link: "https://doi.org/10.1016/j.scs.2021.103139",
    type: "journal" as const,
  },
  {
    title:
      "Towards the definition of a nZEB cost spreadsheet as a support tool for the design",
    journal: "IOP Conference Series (2019)",
    description:
      "Direct precursor of LCCzero — defines the CRAVEzero Excel LCC spreadsheet that this web app productises.",
    type: "conference" as const,
  },
  {
    title:
      "Assessment model of end-of-life costs and waste quantification in selective demolitions: Case studies of nearly zero-energy buildings",
    journal: "Sustainability (2020)",
    description:
      "End-of-life cost methodology for nZEB demolitions — referenced for the residual-value layer.",
    link: "https://doi.org/10.3390/su12156255",
    type: "journal" as const,
  },
  {
    title:
      "Life cycle cost reduction and market acceleration for new nearly zero-energy buildings",
    journal: "IOP Conference Series (2019)",
    description:
      "CRAVEzero programme overview — extra costs, processes, technologies and business models for nZEBs.",
    type: "conference" as const,
  },
];

export function AuthorCard() {
  return (
    <section
      id="author"
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl ring-1 ring-white/40 backdrop-blur-lg lg:p-12 dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="pattern-dots absolute inset-0 -z-0" aria-hidden="true" />
      <div className="relative grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
            Developed by
          </p>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Federico Garzia
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Researcher · Institute for Renewable Energy
            </p>
          </div>

          <a
            href="mailto:federico.garzia@eurac.edu"
            className="inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-eurac-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2 dark:text-slate-200"
          >
            <Mail className="h-4 w-4" />
            federico.garzia@eurac.edu
          </a>

          <div className="flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2 ${s.pill}`}
              >
                {s.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            At Eurac Research, I focus on life-cycle cost and life-cycle
            assessment for nearly zero-energy buildings. LCCzero turns that
            research into a collaborative web workflow for repeatable cost
            analysis, shared assumptions, and reusable case knowledge.
          </p>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Affiliation
            </p>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eurac-red/10 text-xs font-bold text-eurac-red">
                EUR
              </div>
              <div className="text-xs leading-tight">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  Eurac Research
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Institute for Renewable Energy · Bolzano, Italy
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-eurac-red" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Key publications
            </h3>
          </div>
          <div className="space-y-3">
            {PUBLICATIONS.map((p) => (
              <PublicationCard key={p.title} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
