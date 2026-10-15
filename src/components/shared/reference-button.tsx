"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ReferenceModal,
  type Assumption,
} from "@/components/shared/reference-modal";
import type { Citation } from "@/lib/citations";
import type { LCCDomain } from "@/components/shared/icon-badge";

const TINT: Record<LCCDomain, string> = {
  fin: "from-fin-50 to-fin-100/90 text-fin-700 ring-fin-200/80 hover:ring-fin-400 dark:from-fin-950/80 dark:to-fin-900/60 dark:text-fin-300 dark:ring-fin-700/50 dark:hover:ring-fin-500/80",
  construction:
    "from-construction-50 to-construction-100/90 text-construction-800 ring-construction-200/80 hover:ring-construction-400 dark:from-construction-950/80 dark:to-construction-900/60 dark:text-construction-300 dark:ring-construction-700/50 dark:hover:ring-construction-500/80",
  nrg: "from-nrg-50 to-nrg-100/90 text-nrg-800 ring-nrg-200/80 hover:ring-nrg-400 dark:from-nrg-950/80 dark:to-nrg-900/60 dark:text-nrg-300 dark:ring-nrg-700/50 dark:hover:ring-nrg-500/80",
  pv: "from-pv-50 to-pv-100/90 text-pv-800 ring-pv-200/80 hover:ring-pv-400 dark:from-pv-950/80 dark:to-pv-900/60 dark:text-pv-300 dark:ring-pv-700/50 dark:hover:ring-pv-500/80",
  mnt: "from-mnt-50 to-mnt-100/90 text-mnt-800 ring-mnt-200/80 hover:ring-mnt-400 dark:from-mnt-950/80 dark:to-mnt-900/60 dark:text-mnt-300 dark:ring-mnt-700/50 dark:hover:ring-mnt-500/80",
  res: "from-res-50 to-res-100/90 text-res-800 ring-res-200/80 hover:ring-res-400 dark:from-res-950/80 dark:to-res-900/60 dark:text-res-300 dark:ring-res-700/50 dark:hover:ring-res-500/80",
  inc: "from-inc-50 to-inc-100/90 text-inc-800 ring-inc-200/80 hover:ring-inc-400 dark:from-inc-950/80 dark:to-inc-900/60 dark:text-inc-300 dark:ring-inc-700/50 dark:hover:ring-inc-500/80",
};

interface ReferenceButtonProps {
  domain: LCCDomain;
  /** Modal title — usually "<Section> · References & assumptions". */
  title: string;
  citations: Citation[];
  assumptions?: Assumption[];
  /** Optional short label override; defaults to "References". */
  label?: string;
}

export function ReferenceButton({
  domain,
  title,
  citations,
  assumptions,
  label = "References",
}: ReferenceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-2.5 py-1 text-[11px] font-semibold ring-1 transition hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2",
          TINT[domain],
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <BookOpen className="h-3 w-3" />
        {label}
      </button>
      <ReferenceModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        domain={domain}
        citations={citations}
        assumptions={assumptions}
      />
    </>
  );
}
