"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

interface EN15459ComboboxProps {
  value: number;
  onChange: (index: number) => void;
}

export function EN15459Combobox({ value, onChange }: EN15459ComboboxProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const { data: components = [] } = useQuery(
    trpc.reference.en15459Components.queryOptions()
  );

  const selected = components.find((c) => c.index === value);

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-between font-normal sm:max-w-[260px]"
            />
          }
        >
          <span className="truncate text-xs">
            {selected ? selected.name : "Select EN 15459 component..."}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Search EN 15459 component..." />
            <CommandList>
              <CommandEmpty>No component found.</CommandEmpty>
              {components.map((comp) => (
                <CommandItem
                  key={comp.index}
                  value={`${comp.name} ${comp.index}`}
                  data-checked={value === comp.index}
                  onSelect={() => {
                    onChange(comp.index);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{comp.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Lifespan: {comp.lifespanAvg} yr
                      {comp.maintenancePctAvg != null &&
                        ` · Maint: ${(comp.maintenancePctAvg * 100).toFixed(1)}%/yr`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span className="rounded bg-muted px-1.5 py-0.5 tabular-nums">
            {selected.lifespanAvg} yr
          </span>
          {selected.maintenancePctAvg != null && (
            <span className="rounded bg-muted px-1.5 py-0.5 tabular-nums">
              {(selected.maintenancePctAvg * 100).toFixed(1)}%/yr
            </span>
          )}
        </div>
      )}
    </div>
  );
}
