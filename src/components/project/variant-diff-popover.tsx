"use client";

import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { VariantDiffGroup } from "@/lib/project-readiness";

interface VariantDiffPopoverProps {
  projectId: string;
  variantId: string;
  diff: VariantDiffGroup[];
}

function fieldsLabel(count: number) {
  if (count <= 1) {
    return count === 1 ? "modified" : "no changes";
  }
  return `${count} fields changed`;
}

export function VariantDiffPopover({
  projectId,
  variantId,
  diff,
}: VariantDiffPopoverProps) {
  if (diff.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">No delta yet</div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40"
            aria-label={`${diff.length} changed input groups, show details`}
          />
        }
      >
        <span>
          {diff.length} changed input group{diff.length === 1 ? "" : "s"}
        </span>
        <ChevronDown className="size-3" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Changes vs Base
          </p>
          <ul className="space-y-1">
            {diff.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/projects/${projectId}/${group.step}?v=${variantId}&highlight=${group.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {group.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {fieldsLabel(group.changedFields)}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
