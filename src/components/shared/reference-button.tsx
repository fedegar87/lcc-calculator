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
  fin: "from-fin-50 to-fin-100/80 text-fin-700 ring-fin-200/60 hover:ring-fin-300",
  construction:
    "from-construction-50 to-construction-100/80 text-construction-700 ring-construction-200/60 hover:ring-construction-300",
  nrg: "from-nrg-50 to-nrg-100/80 text-nrg-700 ring-nrg-200/60 hover:ring-nrg-300",
  pv: "from-pv-50 to-pv-100/80 text-pv-700 ring-pv-200/60 hover:ring-pv-300",
  mnt: "from-mnt-50 to-mnt-100/80 text-mnt-700 ring-mnt-200/60 hover:ring-mnt-300",
  res: "from-res-50 to-res-100/80 text-res-700 ring-res-200/60 hover:ring-res-300",
  inc: "from-inc-50 to-inc-100/80 text-inc-700 ring-inc-200/60 hover:ring-inc-300",
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
