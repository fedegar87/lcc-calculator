"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SaveStatus } from "@/components/project/save-status";

export type { SaveStatus };

interface SaveStatusContextValue {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

const SaveStatusContext = createContext<SaveStatusContextValue>({
  status: "idle",
  setStatus: () => {},
});

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");

  return (
    <SaveStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  return useContext(SaveStatusContext);
}
