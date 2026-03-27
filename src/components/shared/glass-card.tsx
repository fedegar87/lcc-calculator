import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card/95 p-6 shadow-sm backdrop-blur-sm",
        "dark:bg-card/90 dark:border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
