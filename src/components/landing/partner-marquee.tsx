import { cn } from "@/lib/utils";

type Partner = {
  name: string;
  country: string;
  flag: string;
  role?: string;
  href?: string;
};

const PARTNERS: Partner[] = [
  {
    name: "AEE INTEC",
    country: "Austria",
    flag: "AT",
    role: "Coordinator",
    href: "https://www.aee-intec.at",
  },
  {
    name: "Fraunhofer ISE",
    country: "Germany",
    flag: "DE",
    href: "https://www.ise.fraunhofer.de",
  },
  {
    name: "EURAC Research",
    country: "Italy",
    flag: "IT",
    href: "https://www.eurac.edu",
  },
  {
    name: "3i group",
    country: "Italy",
    flag: "IT",
  },
  {
    name: "SKANSKA",
    country: "Sweden",
    flag: "SE",
    href: "https://www.skanska.com",
  },
  {
    name: "Bouygues Construction",
    country: "France",
    flag: "FR",
    href: "https://www.bouygues-construction.com",
  },
  {
    name: "Köhler & Meinzer",
    country: "Germany",
    flag: "DE",
  },
  {
    name: "ATP sustain",
    country: "Austria",
    flag: "AT",
    href: "https://www.atp-sustain.ag",
  },
  {
    name: "Moretti",
    country: "Italy",
    flag: "IT",
  },
];

function PartnerCard({ partner }: { partner: Partner }) {
  const inner = (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3",
        "min-w-[220px] shadow-sm backdrop-blur-sm transition",
        "hover:-translate-y-0.5 hover:border-eurac-red/40 hover:shadow-md",
        "dark:border-slate-700 dark:bg-slate-900/60",
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        {partner.flag}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-50">
          {partner.name}
        </p>
        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
          {partner.role ? `${partner.role} · ` : ""}
          {partner.country}
        </p>
      </div>
    </div>
  );

  if (partner.href) {
    return (
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2"
        aria-label={`${partner.name} — ${partner.country}${partner.role ? `, ${partner.role}` : ""}`}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

export function PartnerMarquee() {
  const loop = [...PARTNERS, ...PARTNERS];
  return (
    <div
      className="group relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
      }}
      aria-label="CRAVEzero consortium partners"
    >
      <ul className="flex w-max gap-3 animate-marquee-slow group-hover:[animation-play-state:paused]">
        {loop.map((p, i) => (
          <li key={`${p.name}-${i}`}>
            <PartnerCard partner={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
