"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Landing hero CTA.
 * Auth-aware variant (login/register) temporarily disabled — will return once
 * accounts are re-enabled. For now the CTA just scrolls to the methodology
 * section so the landing page stands on its own.
 */
export function LandingCTA() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="outline" size="lg" render={<Link href="#methodology" />}>
        How it works
      </Button>
    </div>
  );
}
