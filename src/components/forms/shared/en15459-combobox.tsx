"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/shared/info-tooltip";
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Search the EN 15459 reference list
        </span>
        <InfoTooltip content="The selected component contributes both a typical lifespan and an annual maintenance percentage. Those values drive replacement cycles and maintenance costs in the LCC result." />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            {selected ? selected.name : "Search component..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                      {comp.lifespanAvg}yr lifespan
                      {comp.maintenancePctAvg != null &&
                        ` / ${comp.maintenancePctAvg}% maint.`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Lifespan: {selected.lifespanAvg} yr</span>
          {selected.maintenancePctAvg != null && (
            <span>Maintenance: {selected.maintenancePctAvg}%</span>
          )}
          <span>Used for replacement and maintenance cost cycles.</span>
        </div>
      )}
    </div>
  );
}
