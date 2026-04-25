import Image from "next/image";
import { cn } from "@/lib/utils";
import { ExternalLink, MapPin } from "lucide-react";

type CaseStudy = {
  name: string;
  country: string;
  type: "Residential" | "Office" | "Single-family";
  location: string;
  year: string;
  gfa: string;
  systems: string;
  lcc: string;
  link?: string;
  flag: string;
  tone: "construction" | "fin" | "nrg" | "mnt";
  image?: string;
};

const CASES: CaseStudy[] = [
  {
    name: "Solallén",
    country: "Sweden",
    flag: "🇸🇪",
    location: "Växjö",
    year: "2015",
    type: "Residential",
    gfa: "11,500 m²",
    systems: "GSHP · MVHR · 120 kWp PV · Net ZEB",
    lcc: "€2,185 /m² · 40y",
    link: "https://cravezero.eu/2017/10/18/solallen/",
    tone: "construction",
    image: "/cravezero/building_solallen.png",
  },
  {
    name: "Aspern IQ",
    country: "Austria",
    flag: "🇦🇹",
    location: "Vienna",
    year: "2012",
    type: "Office",
    gfa: "10,620 m²",
    systems: "Heat pump · PV · 10 kW wind · Plus Energy",
    lcc: "€1,681 /m² · 40y",
    link: "https://cravezero.eu/2017/10/18/aspern-iq/",
    tone: "fin",
    image: "/cravezero/building_aspern_iq.png",
  },
  {
    name: "Résidence Alizari",
    country: "France",
    flag: "🇫🇷",
    location: "Malaunay",
    year: "2015",
    type: "Residential",
    gfa: "2,190 m²",
    systems: "PassivHaus · wood boiler · double-flux MVHR · PV",
    lcc: "€2,230 /m² · 40y",
    link: "https://cravezero.eu/2018/02/20/alizari/",
    tone: "nrg",
    image: "/cravezero/building_alizari.png",
  },
  {
    name: "MORE",
    country: "Italy",
    flag: "🇮🇹",
    location: "Lodi",
    year: "2014",
    type: "Single-family",
    gfa: "175 m²",
    systems: "Heat pump + condensing boiler · solar thermal · MVHR",
    lcc: "€4,716 /m² · 40y",
    link: "https://cravezero.eu/2017/10/18/more/",
    tone: "mnt",
    image: "/cravezero/building_more.png",
  },
];

const TONE_TILE: Record<CaseStudy["tone"], string> = {
  construction:
    "border-construction-100 bg-construction-50 ring-construction-100 dark:border-construction-500/20 dark:bg-construction-500/10 dark:ring-construction-500/20",
  fin: "border-fin-100 bg-fin-50 ring-fin-100 dark:border-fin-500/20 dark:bg-fin-500/10 dark:ring-fin-500/20",
  nrg: "border-nrg-100 bg-nrg-50 ring-nrg-100 dark:border-nrg-500/20 dark:bg-nrg-500/10 dark:ring-nrg-500/20",
  mnt: "border-mnt-100 bg-mnt-50 ring-mnt-100 dark:border-mnt-500/20 dark:bg-mnt-500/10 dark:ring-mnt-500/20",
};

const TONE_BADGE: Record<CaseStudy["tone"], string> = {
  construction: "bg-construction-100 text-construction-700",
  fin: "bg-fin-100 text-fin-700",
  nrg: "bg-nrg-100 text-nrg-700",
  mnt: "bg-mnt-100 text-mnt-700",
};

export function CaseStudies() {
  return (
    <section className="space-y-4">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Case studies
        </p>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Frontrunner buildings behind the methodology
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          A selection of the 13 nZEBs analysed in deliverable D2.2 — covering
          residential, office and single-family typologies across four
          countries.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CASES.map((c) => {
          const card = (
            <article
              className={cn(
                "group flex h-full flex-col gap-3 rounded-2xl border p-4 ring-1 transition hover:-translate-y-0.5 hover:shadow-md",
                TONE_TILE[c.tone],
                c.image ? "overflow-hidden" : ""
              )}
            >
              {c.image && (
                <div className="relative -mx-4 -mt-4 mb-1 aspect-video overflow-hidden border-b border-inherit">
                  <Image
                    src={c.image}
                    alt={`${c.name} building`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    <span className="mr-1.5">{c.flag}</span>
                    {c.name}
                  </h4>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {c.location}, {c.country} · {c.year}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    TONE_BADGE[c.tone],
                  )}
                >
                  {c.type}
                </span>
              </header>

              <dl className="space-y-1.5 text-xs">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    GFA
                  </dt>
                  <dd className="text-slate-700 dark:text-slate-200">{c.gfa}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Systems
                  </dt>
                  <dd className="text-slate-700 dark:text-slate-200">
                    {c.systems}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    LCC
                  </dt>
                  <dd className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {c.lcc}
                  </dd>
                </div>
              </dl>

              {c.link ? (
                <p className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 transition group-hover:text-eurac-red dark:text-slate-300">
                  Fact sheet
                  <ExternalLink className="h-3 w-3" />
                </p>
              ) : null}
            </article>
          );

          return c.link ? (
            <a
              key={c.name}
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/30"
            >
              {card}
            </a>
          ) : (
            <div key={c.name}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
