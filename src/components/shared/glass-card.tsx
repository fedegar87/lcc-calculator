import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-md backdrop-blur-xl glass-specular transition-all duration-200",
        "dark:border-white/[0.09] dark:bg-card/85 dark:text-slate-100 dark:shadow-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
