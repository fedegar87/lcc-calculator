import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-2xl border bg-card p-6 text-card-foreground transition-[transform,box-shadow,border-color] duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
