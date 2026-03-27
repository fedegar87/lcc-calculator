"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Variant {
  id: string;
  label: string;
}

interface VariantTabsProps {
  variants: Variant[];
  activeVariantId: string;
  onVariantChange: (variantId: string) => void;
}

export function VariantTabs({
  variants,
  activeVariantId,
  onVariantChange,
}: VariantTabsProps) {
  return (
    <Tabs value={activeVariantId} onValueChange={onVariantChange}>
      <TabsList>
        {variants.map((v) => (
          <TabsTrigger key={v.id} value={v.id}>
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
