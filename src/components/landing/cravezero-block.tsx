import Image from "next/image";
import { GlassCard } from "@/components/shared/glass-card";
import { ExternalLink, Users, Calendar, Award } from "lucide-react";
import { PartnerMarquee } from "./partner-marquee";

const FACTS = [
  { icon: Calendar, label: "Sept 2017 – Aug 2020", sub: "36 months · H2020 RIA" },
  { icon: Award, label: "Grant Agreement 741223", sub: "European Commission" },
  { icon: Users, label: "9 partners · 5 countries", sub: "Coordinator: AEE INTEC" },
];

export function CRAVEzeroBlock() {
  return (
    <GlassCard id="about-cravezero" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
            About the parent project
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            CRAVEzero — closing the cost gap of nZEBs
          </h2>
        </div>
        <Image
          src="/cravezero/eu-funding.png"
          alt="Funded by the European Union — Horizon 2020 Research and Innovation Programme"
          width={300}
          height={80}
          className="h-12 w-auto shrink-0"
          unoptimized
        />
      </header>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <strong className="text-slate-900 dark:text-slate-100">CRAVEzero</strong>{" "}
        — <em>Cost Reduction and market Acceleration for Viable nearly
        zero-Energy buildings</em> — ran from 2017 to 2020 as Horizon 2020
        Grant Agreement 741223, led by AEE INTEC with nine partners across five
        countries. The project documented 13 frontrunner buildings (D2.2) and
        turned that work into open deliverables: the Pinboard, the full Excel
        LCC tool, the case-study dashboard, the business-model canvas, and the
        process map.
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {f.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Consortium · 9 partners across 5 countries
        </p>
        <PartnerMarquee />
      </div>

      <a
        href="https://www.cravezero.eu"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-eurac-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2"
      >
        Visit cravezero.eu
        <ExternalLink className="h-3 w-3" />
      </a>
    </GlassCard>
  );
}
