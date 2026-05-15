import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  variant?: "bar" | "line" | "pie" | "table";
  className?: string;
}

export function ChartSkeleton({
  variant = "bar",
  className,
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card/70 p-4 motion-safe:animate-pulse",
        className,
      )}
      aria-hidden="true"
    >
      <div className="mb-4 h-4 w-32 rounded bg-muted" />
      {variant === "line" ? (
        <div className="flex h-56 items-end gap-3">
          {[30, 46, 40, 58, 68, 76].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end">
              <div
                className="rounded-t bg-muted"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      ) : variant === "pie" ? (
        <div className="flex h-56 items-center justify-center">
          <div className="size-36 rounded-full border-[24px] border-muted" />
        </div>
      ) : variant === "table" ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 flex-1 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-56 items-end gap-3">
          {[72, 48, 64, 38, 82, 56].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end">
              <div
                className="rounded-t bg-muted"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
