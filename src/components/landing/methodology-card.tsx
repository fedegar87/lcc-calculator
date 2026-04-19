import { GlassCard } from "@/components/shared/glass-card";
import { ReferenceButton } from "@/components/shared/reference-button";
import {
  FOUNDATIONAL_CITATIONS,
  METHODOLOGY_CITATIONS,
  BOUNDARY_CITATIONS,
} from "@/lib/citations";

const ROWS = [
  {
    label: "LCC framework",
    value: "ISO 15686-5 · NPV over 40 years",
  },
  {
    label: "Cost breakdown",
    value: "European Code of Measurement (CEEC, 2004)",
  },
  {
    label: "Maintenance",
    value: "EN 15459-1:2017 yearly factors per component",
  },
  {
    label: "Energy demand",
    value: "PHPP — Passive House Planning Package",
  },
  {
    label: "Sensitivity analysis",
    value: "DSA + Elementary Effects (Morris 1991, Campolongo 2007)",
  },
  {
    label: "Empirical baseline",
    value: "11 nZEB case studies, H2020 CRAVEzero (GA 741223)",
  },
];

export function MethodologyCard() {
  return (
    <GlassCard id="methodology-standards" className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
            Methodology
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Standards, models and provenance
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every number in LCCzero traces back to a public standard or a
            peer-reviewed paper. Open the references to see where each
            assumption comes from.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <ReferenceButton
            domain="construction"
            title="LCCzero — foundational research"
            citations={FOUNDATIONAL_CITATIONS}
            label="Paper"
          />
          <ReferenceButton
            domain="fin"
            title="Standards & sensitivity methodology"
            citations={METHODOLOGY_CITATIONS}
            label="Standards"
          />
          <ReferenceButton
            domain="nrg"
            title="Boundary conditions & prices"
            citations={BOUNDARY_CITATIONS}
            label="Boundary"
          />
        </div>
      </header>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {ROWS.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {r.label}
            </dt>
            <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}
