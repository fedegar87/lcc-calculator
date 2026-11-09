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
        className="object-cover opacity-20 mix-blend-overlay dark:opacity-10"
        priority
      />
    </div>
  );
}
