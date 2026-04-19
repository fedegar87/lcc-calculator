import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { Hero } from "@/components/landing/hero";
import { DomainTiles } from "@/components/landing/domain-tiles";
import { ValueCards } from "@/components/landing/value-cards";
import { CRAVEzeroBlock } from "@/components/landing/cravezero-block";
import { PinboardBlock } from "@/components/landing/pinboard-block";
import { MethodologySteps } from "@/components/landing/methodology-steps";
import { FindingsStats } from "@/components/landing/findings-stats";
import { MethodologyCard } from "@/components/landing/methodology-card";
import { AuthorCard } from "@/components/landing/author-card";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <AmbientBackground />
      <div className="container relative mx-auto px-4 py-8 lg:py-12">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            LCC<span className="text-eurac-red">zero</span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <a
              href="#about-cravezero"
              className="hidden font-semibold text-slate-600 hover:text-eurac-red sm:inline"
            >
              CRAVEzero
            </a>
            <a
              href="#pinboard"
              className="hidden font-semibold text-slate-600 hover:text-eurac-red sm:inline"
            >
              Pinboard
            </a>
            <a
              href="#about"
              className="hidden font-semibold text-slate-600 hover:text-eurac-red sm:inline"
            >
              About
            </a>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              v1.0 preview
            </span>
          </nav>
        </header>

        <div className="space-y-12">
          <Hero />
          <DomainTiles />
          <ValueCards />
          <CRAVEzeroBlock />
          <PinboardBlock />
          <MethodologySteps />
          <FindingsStats />
          <MethodologyCard />
          <AuthorCard />

          <footer className="space-y-4 pb-8 pt-6 text-xs text-slate-500">
            <p className="text-center">
              Funded under H2020 Grant Agreement No. 741223 ·{" "}
              <a
                href="https://www.cravezero.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-eurac-red hover:underline"
              >
                cravezero.eu
              </a>
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <a
                href="http://www.cravezero.eu/pinboard/Downloads/LCCTool.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-eurac-red"
              >
                Original CRAVEzero LCC tool
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-300">·</span>
              <a
                href="https://www.cravezero.eu/pboard/PinboardMain/PinboardMain/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-eurac-red"
              >
                CRAVEzero Pinboard
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-300">·</span>
              <a
                href="https://www.cravezero.eu/reports/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-eurac-red"
              >
                Public deliverables
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
