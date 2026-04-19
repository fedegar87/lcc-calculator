import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { Hero } from "@/components/landing/hero";
import { DomainTiles } from "@/components/landing/domain-tiles";
import { ValueCards } from "@/components/landing/value-cards";
import { CRAVEzeroBlock } from "@/components/landing/cravezero-block";
import { PinboardBlock } from "@/components/landing/pinboard-block";
import { MethodologySteps } from "@/components/landing/methodology-steps";
import { FindingsStats } from "@/components/landing/findings-stats";
import { CaseStudies } from "@/components/landing/case-studies";
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
              href="#case-studies"
              className="hidden font-semibold text-slate-600 hover:text-eurac-red sm:inline"
            >
              Case studies
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
          <section id="case-studies">
            <CaseStudies />
          </section>
          <MethodologyCard />
          <AuthorCard />

          <footer className="space-y-4 pb-8 pt-6 text-xs text-slate-500">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white/60 p-5 ring-1 ring-white/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:justify-between">
              <a
                href="https://www.cravezero.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-[280px]"
                aria-label="CRAVEzero project home"
              >
                <Image
                  src="/cravezero/cravezero-banner.gif"
                  alt="CRAVEzero — Cost Reduction and market Acceleration for Viable nearly zero-Energy buildings"
                  width={1140}
                  height={60}
                  className="h-auto w-full rounded-md bg-slate-900 p-2"
                  unoptimized
                />
              </a>
              <Image
                src="/cravezero/eu-funding.png"
                alt="Funded by the European Union — Horizon 2020 Research and Innovation Programme"
                width={300}
                height={80}
                className="h-12 w-auto"
                unoptimized
              />
            </div>

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
