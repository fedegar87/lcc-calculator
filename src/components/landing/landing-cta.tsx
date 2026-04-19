"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Landing hero CTA.
 * Auth-aware variant (login/register) temporarily disabled — will return once
 * accounts are re-enabled. Primary CTA enters the tool; secondary scrolls to
 * the methodology section.
 */
export function LandingCTA() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="brand" size="lg" render={<Link href="/projects" />}>
        Open the tool
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <Button variant="outline" size="lg" render={<Link href="#methodology" />}>
        How it works
      </Button>
    </div>
  );
}
