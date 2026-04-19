import { GlassCard } from "@/components/shared/glass-card";
import { DomainTiles } from "./domain-tiles";
import { ValueCards } from "./value-cards";

export function WhatItDoes() {
  return (
    <GlassCard id="overview" className="space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
          What LCCzero covers
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Three domains, one life-cycle view
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Investment, operation, and sensitivity stay connected so design
          choices can be read as a single life-cycle picture.
        </p>
      </header>

      <div className="space-y-4">
        <DomainTiles />
        <ValueCards />
      </div>
    </GlassCard>
  );
}
