"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type LandingNavMode = "mobile" | "desktop";

type NavItem = {
  href: `#${string}`;
  label: string;
};

const DESKTOP_ITEMS: NavItem[] = [
  { href: "#overview", label: "Overview" },
  { href: "#about-cravezero", label: "CRAVEzero" },
  { href: "#pinboard", label: "Pinboard" },
  { href: "#methodology", label: "Methodology" },
  { href: "#findings", label: "Findings" },
  { href: "#author", label: "Author" },
];

const MOBILE_ITEMS = DESKTOP_ITEMS.slice(0, 3);

export function LandingNav({ mode }: { mode: LandingNavMode }) {
  const items = useMemo(
    () => (mode === "desktop" ? DESKTOP_ITEMS : MOBILE_ITEMS),
    [mode],
  );
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "#overview");

  useEffect(() => {
    const sections = items
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            if (b.intersectionRatio !== a.intersectionRatio) {
              return b.intersectionRatio - a.intersectionRatio;
            }

            return a.boundingClientRect.top - b.boundingClientRect.top;
          });

        if (!visible.length) return;

        const nextHref = `#${visible[0].target.id}` as NavItem["href"];
        setActiveHref(nextHref);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.4, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [items]);

  if (mode === "desktop") {
    return (
      <nav
        aria-label="Landing page sections"
        className="rounded-2xl border border-white/20 bg-white/70 p-3 shadow-xl backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/70"
      >
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2",
                  isActive
                    ? "bg-eurac-red/10 text-eurac-red"
                    : "text-slate-600 hover:text-eurac-red dark:text-slate-300 dark:hover:text-eurac-red",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Landing page shortcuts"
      className="hidden items-center gap-3 text-xs sm:flex lg:hidden"
    >
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2",
              isActive
                ? "text-eurac-red"
                : "text-slate-600 hover:text-eurac-red dark:text-slate-300 dark:hover:text-eurac-red",
            )}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
