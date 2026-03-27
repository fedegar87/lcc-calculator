"use client";

import { useEffect, useRef } from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import type { SaveStatus } from "@/components/project/save-status";
import { useSaveStatus } from "./use-save-status";

interface UseAutosaveOptions<T extends FieldValues> {
  control: Control<T>;
  onSave: (values: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave<T extends FieldValues>({
  control,
  onSave,
  debounceMs = 500,
  enabled = true,
}: UseAutosaveOptions<T>): { status: SaveStatus } {
  const values = useWatch({ control });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevRef = useRef<string>("");
  const statusRef = useRef<SaveStatus>("idle");
  const { setStatus } = useSaveStatus();

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(values);

    // Prevent infinite loop: only save when values actually changed
    if (serialized === prevRef.current) return;

    // Skip the very first render (initial form hydration)
    if (prevRef.current === "") {
      prevRef.current = serialized;
      return;
    }

    prevRef.current = serialized;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      statusRef.current = "saving";
      setStatus("saving");

      onSave(values as T)
        .then(() => {
          statusRef.current = "saved";
          setStatus("saved");
        })
        .catch(() => {
          statusRef.current = "failed";
          setStatus("failed");
        });
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [values, enabled, debounceMs, onSave, setStatus]);

  return { status: statusRef.current };
}
