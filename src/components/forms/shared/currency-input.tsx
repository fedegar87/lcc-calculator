"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencyInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
}

export function CurrencyInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
}: CurrencyInputProps<T>) {
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
            value={value as number | undefined}
            onValueChange={(vals) => onChange(vals.floatValue ?? 0)}
            thousandSeparator=","
            decimalScale={2}
            fixedDecimalScale
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
