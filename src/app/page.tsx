import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { AuthorCard } from "@/components/landing/author-card";
import { CRAVEzeroBlock } from "@/components/landing/cravezero-block";
import { FindingsStats } from "@/components/landing/findings-stats";
import { Hero } from "@/components/landing/hero";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingNav } from "@/components/landing/landing-nav";
import { MethodologyCard } from "@/components/landing/methodology-card";
import { MethodologySteps } from "@/components/landing/methodology-steps";
import { PinboardBlock } from "@/components/landing/pinboard-block";
import { WhatItDoes } from "@/components/landing/what-it-does";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <AmbientBackground />
      <div className="container relative mx-auto px-4 py-8 lg:py-12">
        <header className="mb-8 flex items-center justify-between gap-4 lg:mb-12">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            LCC<span className="text-eurac-red">zero</span>
          </Link>
          <div className="flex items-center gap-3">
            <LandingNav mode="mobile" />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              v1.0 preview
            </span>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <LandingNav mode="desktop" />
            </div>
          </aside>

          <div className="space-y-12">
            <Hero />
            <WhatItDoes />
            <CRAVEzeroBlock />
            <PinboardBlock />
            <MethodologySteps />
            <MethodologyCard />
            <FindingsStats />
            <div className="flex justify-center pt-2">
              <LandingCTA />
            </div>
            <AuthorCard />

            <footer className="space-y-4 pb-8 pt-6 text-xs text-slate-500">
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
      </div>
    </main>
  );
}
