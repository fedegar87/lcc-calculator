import Image from "next/image";
import { GlassCard } from "@/components/shared/glass-card";
import { ExternalLink, Users, Calendar, Award } from "lucide-react";

const FACTS = [
  { icon: Calendar, label: "Sept 2017 – Aug 2020", sub: "36 months · H2020 RIA" },
  { icon: Award, label: "Grant Agreement 741223", sub: "European Commission" },
  { icon: Users, label: "9 partners · 5 countries", sub: "Coordinator: AEE INTEC" },
];

export function CRAVEzeroBlock() {
  return (
    <GlassCard id="about-cravezero" className="space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
          About the parent project
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          CRAVEzero — closing the cost gap of nZEBs
        </h2>
      </header>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <strong className="text-slate-900 dark:text-slate-100">CRAVEzero</strong>{" "}
        — <em>Cost Reduction and market Acceleration for Viable nearly
        zero-Energy buildings</em> — was a Horizon 2020 research project
        (2017–2020) that tackled the single biggest objection to nZEBs:
        they cost too much. Across nine partners from five countries, the
        consortium dissected 13 frontrunner buildings and produced open
        tools — a life-cycle cost spreadsheet, an interactive case-study
        dashboard, a business-model canvas and a process map — so planners
        can hit EPBD targets without blowing the budget.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {FACTS.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.label}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
            >
              <Icon className="mb-2 h-4 w-4 text-eurac-red" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-50">
                {f.label}
              </p>
              <p className="text-[11px] text-slate-500">{f.sub}</p>
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Consortium · 9 partners across 5 countries
        </p>
        <div className="overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <Image
            src="/cravezero/partners.gif"
            alt="CRAVEzero consortium logos: AEE INTEC (coordinator), Fraunhofer ISE, EURAC, 3i group, SKANSKA, Bouygues Construction, Köhler & Meinzer, ATP sustain, Moretti"
            width={650}
            height={400}
            className="mx-auto h-auto w-full max-w-xl"
            sizes="(min-width: 1024px) 600px, 90vw"
            unoptimized
          />
        </div>
      </div>

      <a
        href="https://www.cravezero.eu"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-eurac-red hover:underline"
      >
        Visit cravezero.eu
        <ExternalLink className="h-3 w-3" />
      </a>
    </GlassCard>
  );
}
