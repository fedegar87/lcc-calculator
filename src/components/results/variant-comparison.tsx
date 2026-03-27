"use client";

interface VariantComparisonProps {
  projectId: string;
  variants: { id: string; label: string }[];
}

export function VariantComparison({ projectId: _projectId, variants: _variants }: VariantComparisonProps) {
  // Placeholder -- full implementation in Task 3
  return <div className="py-8 text-center text-muted-foreground">Loading comparison...</div>;
}
