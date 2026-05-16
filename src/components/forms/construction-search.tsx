"use client";

import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface CategoryDef {
  value: string;
  label: string;
  group: string;
}

interface ConstructionSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDef[];
  onSelect: (category: CategoryDef) => void;
}

export function ConstructionSearch({
  open,
  onOpenChange,
  categories,
  onSelect,
}: ConstructionSearchProps) {
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      const isToggle =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isToggle) return;
      event.preventDefault();
      onOpenChange(!open);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onOpenChange]);

  const byGroup = categories.reduce<Record<string, CategoryDef[]>>(
    (acc, cat) => {
      const bucket = acc[cat.group] ?? [];
      bucket.push(cat);
      acc[cat.group] = bucket;
      return acc;
    },
    {},
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Jump to construction category"
      description="Search categories by code or description"
    >
      <CommandInput placeholder="Search categories…" autoFocus />
      <CommandList>
        <CommandEmpty>No categories found.</CommandEmpty>
        {Object.entries(byGroup).map(([groupName, items]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {items.map((cat) => (
              <CommandItem
                key={cat.value}
                value={`${cat.value} ${cat.label} ${cat.group}`}
                onSelect={() => onSelect(cat)}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {cat.value}
                </span>
                <span>{cat.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
