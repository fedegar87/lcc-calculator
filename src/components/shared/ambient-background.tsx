import Image from "next/image";
import { cn } from "@/lib/utils";

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <Image
        src="/visuals/ambient_background.png"
        alt="Ambient architectural background"
        fill
        className="object-cover opacity-30 mix-blend-overlay dark:opacity-10"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white/80 to-slate-100/90 dark:from-slate-950/90 dark:via-slate-900/95 dark:to-slate-950/90 backdrop-blur-3xl" />
    </div>
  );
}
