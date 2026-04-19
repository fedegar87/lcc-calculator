import { LandingCTA } from "./landing-cta";

/**
 * Hero card â€” title cluster + auth-aware CTA pair.
 * Visual hook for the landing page (top of overview).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl ring-1 ring-white/40 backdrop-blur-lg lg:p-12 dark:border-white/10 dark:bg-slate-900/70">
      <div className="pattern-dots absolute inset-0 -z-0" aria-hidden="true" />
      <div className="relative space-y-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-eurac-red">
            CRAVEzero · H2020 · Eurac Research
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-5xl dark:text-slate-50">
            From design choices
            <br />
            to <span className="text-eurac-red">life-cycle cost</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            LCCzero is the modern web successor of the CRAVEzero{" "}
            <strong className="text-slate-900 dark:text-slate-50">
              full Excel LCC workbook
            </strong>{" "}
            — not the reduced web calculator that also lives on the Pinboard.
            Rebuilt on the same ISO 15686-5 methodology that benchmarked nearly
            zero-energy buildings across Europe, extended with collaboration,
            shared case libraries, and current data.
          </p>
        </div>

        <div className="flex justify-center">
          <LandingCTA />
        </div>
      </div>
    </section>
  );
}
