/**
 * Frozen domain-to-color mapping for Recharts visualizations.
 * See docs/visual-identity.md for the rationale. Do NOT introduce
 * arbitrary chart-1..chart-5 colors — every series must belong to a
 * specific LCC domain.
 */

export type LCCDomain =
  | "fin"
  | "construction"
  | "nrg"
  | "pv"
  | "mnt"
  | "res"
  | "inc"
  | "totals";

const DOMAIN_HEX: Record<LCCDomain, string> = {
  fin: "#3b82f6",          // blue-500   -- finance / boundary conditions
  construction: "#f59e0b", // amber-500  -- construction costs
  nrg: "#06b6d4",          // cyan-500   -- delivered energy
  pv: "#eab308",           // yellow-500 -- PV production
  mnt: "#14b8a6",          // teal-500   -- maintenance / EN 15459
  res: "#8b5cf6",          // violet-500 -- residual value
  inc: "#10b981",          // emerald-500-- income / NPV
  totals: "#0f172a",       // slate-900  -- LCC / WLC grand totals
};

const DOMAIN_HEX_600: Record<LCCDomain, string> = {
  fin: "#2563eb",
  construction: "#d97706",
  nrg: "#0891b2",
  pv: "#ca8a04",
  mnt: "#0d9488",
  res: "#7c3aed",
  inc: "#059669",
  totals: "#0f172a",
};

export function domainColor(domain: LCCDomain): string {
  return DOMAIN_HEX[domain];
}

export function domainColorStrong(domain: LCCDomain): string {
  return DOMAIN_HEX_600[domain];
}

export const chartTheme = {
  strokeDasharray: "3 3",
  gridStroke: "#e2e8f0",
  barSize: 32,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  tooltipContentStyle: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    fontSize: 11,
    padding: "8px 10px",
  } as const,
  tooltipLabelStyle: {
    color: "#0f172a",
    fontWeight: 600,
    marginBottom: 4,
  } as const,
  tooltipItemStyle: {
    color: "#334155",
    fontSize: 11,
  } as const,
  axisTick: {
    fontSize: 11,
    fill: "#64748b",
  } as const,
  axisLine: {
    stroke: "#e2e8f0",
  } as const,
};
