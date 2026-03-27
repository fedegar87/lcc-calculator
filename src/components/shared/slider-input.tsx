"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "./info-tooltip";

interface SliderInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  tooltip?: string;
}

export function SliderInput<T extends FieldValues>({
  name,
  control,
  label,
  min,
  max,
  step = 1,
  unit,
  tooltip,
}: SliderInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label>{label}</Label>
            {tooltip && <InfoTooltip content={tooltip} />}
            <span className="ml-auto text-sm font-medium tabular-nums">
              {value ?? min}
              {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
            </span>
          </div>
          <Slider
            value={[typeof value === "number" ? value : min]}
            onValueChange={(vals) => {
              const v = Array.isArray(vals) ? vals[0] : vals;
              onChange(v);
            }}
            min={min}
            max={max}
            step={step}
          />
        </div>
      )}
    />
  );
}
