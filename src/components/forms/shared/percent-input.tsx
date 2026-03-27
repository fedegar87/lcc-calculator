"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PercentInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
}

export function PercentInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
}: PercentInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref, ...field }, fieldState }) => (
        <div className="space-y-1">
          <Label htmlFor={name}>{label}</Label>
          <NumericFormat
            {...field}
            getInputRef={ref}
            id={name}
            // Value stored as decimal (e.g. 0.0151), displayed as percentage (1.51%)
            value={typeof value === "number" ? value * 100 : undefined}
            onValueChange={(vals) => {
              const displayVal = vals.floatValue;
              onChange(displayVal != null ? displayVal / 100 : 0);
            }}
            decimalScale={4}
            suffix=" %"
            placeholder={placeholder}
            customInput={Input}
            className={cn(fieldState.invalid && "border-destructive")}
          />
          {fieldState.error && (
            <p className="text-sm text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
