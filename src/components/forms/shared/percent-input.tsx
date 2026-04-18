"use client";

import { useState } from "react";
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
  hint?: string;
}

export function PercentInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  hint,
}: PercentInputProps<T>) {
  const [helperText, setHelperText] = useState<string | null>(null);

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
            value={typeof value === "number" ? value * 100 : undefined}
            onValueChange={(vals) => {
              const rawValue = vals.value ?? "";
              const displayVal = vals.floatValue;

              if (displayVal == null) {
                setHelperText(null);
                onChange(0);
                return;
              }

              let nextValue = displayVal / 100;
              let nextHelper: string | null = null;

              if (
                rawValue.includes(".") &&
                Math.abs(displayVal) <= 1
              ) {
                nextValue = displayVal;
                nextHelper = `Interpreted ${rawValue} as ${(displayVal * 100).toFixed(2)}%.`;
              } else if (Math.abs(displayVal) > 100) {
                nextHelper =
                  "This looks larger than 100%. Review the value before leaving the field.";
              }

              setHelperText(nextHelper);
              onChange(nextValue);
            }}
            decimalScale={4}
            suffix=" %"
            placeholder={placeholder}
            customInput={Input}
            className={cn(fieldState.invalid && "border-destructive")}
            aria-describedby={
              helperText || hint ? `${name}-help` : undefined
            }
          />
          {(helperText || hint) && !fieldState.error && (
            <p
              id={`${name}-help`}
              className="text-xs text-muted-foreground"
            >
              {helperText ?? hint}
            </p>
          )}
          {fieldState.error && (
            <p className="text-sm text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
