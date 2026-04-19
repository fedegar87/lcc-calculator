import Image from "next/image";
import { GlassCard } from "@/components/shared/glass-card";
import { ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = {
  name: string;
  desc: string;
  highlight?: "successor" | "sibling";
  href?: string;
};

const TOOLS: Tool[] = [
  {
    name: "Case Study Dashboard",
    desc: "Interactive exploration of frontrunner buildings (~500k variants).",
    href: "http://www.cravezero.eu/pinboard/Dashboard/DBInfo.html",
  },
  { name: "nZEB Revenue Stream", desc: "Financial modelling support." },
  { name: "Business Model Canvas", desc: "Strategic planning resource." },
  { name: "nZEB Process Map", desc: "Interactive life-cycle workflow." },
  { name: "LCC Database (beta)", desc: "Life-cycle cost repository." },
  { name: "Life Cycle Project Management", desc: "Project tracking." },
  {
    name: "Life Cycle Cost Calculator",
    desc: "Reduced web version — preliminary LCC on aggregated inputs.",
  },
  {
    name: "LCC Tool — full Excel workbook",
    desc: "Complete version with all functionalities. LCCzero is the web successor of this tool.",
    highlight: "successor",
  },
  { name: "nZEB Life Cycle Tracker Tool", desc: "Downloadable Excel tracker." },
];

export function PinboardBlock() {
  return (
    <GlassCard id="pinboard" className="space-y-6">
      <header className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-eurac-red">
            The CRAVEzero Pinboard
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            The hub for every tool the project produced
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            The Pinboard is CRAVEzero&rsquo;s interactive web platform — a
            framework that bundles every artefact the consortium built into one
            place: dashboards, business-model canvases, process maps, and{" "}
            <strong className="text-slate-900 dark:text-slate-50">
              two LCC tools
            </strong>
            . LCCzero is the modern web successor of the{" "}
            <strong className="text-slate-900 dark:text-slate-50">
              full Excel workbook
            </strong>
            , not of the reduced preliminary calculator.
          </p>
          <a
            href="https://www.cravezero.eu/pboard/PinboardMain/PinboardMain/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-eurac-red hover:underline"
          >
            Open the Pinboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <a
          href="https://www.cravezero.eu/pboard/PinboardMain/PinboardMain/"
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-2xl ring-1 ring-slate-200 transition hover:ring-eurac-red/40 dark:ring-slate-800"
          aria-label="CRAVEzero Pinboard interface preview"
        >
          <Image
            src="/cravezero/pinboard.jpg"
            alt="Screenshot of the CRAVEzero Pinboard interactive web platform"
            width={1024}
            height={707}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
        </a>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const isSuccessor = t.highlight === "successor";
          const isSibling = t.highlight === "sibling";
          const inner = (
            <article
              className={cn(
                "flex h-full flex-col gap-1 rounded-xl border p-3 transition",
                isSuccessor
                  ? "border-eurac-red/40 bg-eurac-red/5 ring-1 ring-eurac-red/20"
                  : isSibling
                    ? "border-fin-200 bg-fin-50/40"
                    : "border-slate-100 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-50">
                  {t.name}
                </p>
                {isSuccessor ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-eurac-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    <Sparkles className="h-2.5 w-2.5" />
                    LCCzero
                  </span>
                ) : isSibling ? (
                  <span className="shrink-0 rounded-full bg-fin-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fin-700">
                    Reduced
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {t.desc}
              </p>
              {t.href ? (
                <p className="mt-auto pt-1 text-[10px] font-semibold text-slate-500">
                  Source ↗
                </p>
              ) : null}
            </article>
          );
          return (
            <li key={t.name}>
              {t.href ? (
                <a
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/30"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
