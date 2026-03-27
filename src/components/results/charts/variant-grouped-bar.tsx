"use client";

import type { LCCResult } from "@/engine/types";

interface VariantGroupedBarProps {
  variants: { label: string; result: LCCResult }[];
}

export function VariantGroupedBar({ variants: _variants }: VariantGroupedBarProps) {
  // Placeholder -- full implementation in Task 2
  return <div className="h-[300px]" />;
}
