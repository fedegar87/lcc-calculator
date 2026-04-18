import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-lg",
        "dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
