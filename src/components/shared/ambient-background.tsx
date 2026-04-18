import { cn } from "@/lib/utils";

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100",
        "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
        className,
      )}
    >
      <div className="ambient-blob ambient-blob-red left-[-6rem] top-[-4rem] h-72 w-72" />
      <div className="ambient-blob ambient-blob-blue right-[-5rem] top-16 h-72 w-72" />
      <div className="ambient-blob ambient-blob-emerald bottom-[-6rem] right-1/4 h-72 w-72" />
    </div>
  );
}
