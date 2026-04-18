"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InfoTooltip({
  content,
  label = "More information",
}: {
  content: ReactNode;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="inline-flex items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/30"
        aria-label={label}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-[11px] leading-relaxed text-slate-100 shadow-lg">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
