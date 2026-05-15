"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BarChart3,
  BookOpenText,
  FileText,
  LayoutDashboard,
  Menu,
  Pin,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type LandingNavMode = "mobile" | "desktop";

type NavItem = {
  href: `#${string}`;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const DESKTOP_ITEMS: NavItem[] = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#about-cravezero", label: "CRAVEzero", icon: BookOpenText },
  { href: "#pinboard", label: "Pinboard", icon: Pin },
  { href: "#methodology", label: "Methodology", icon: FileText },
  { href: "#findings", label: "Findings", icon: BarChart3 },
  { href: "#author", label: "Author", icon: UserRound },
];

export function LandingNav({ mode }: { mode: LandingNavMode }) {
  const items = useMemo(() => DESKTOP_ITEMS, []);
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "#overview");
  const [sheetOpen, setSheetOpen] = useState(false);

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
      className="flex items-center lg:hidden"
    >
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open site navigation"
            />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="right" aria-label="Site navigation">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Jump to a section on this page.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-1 p-4 pt-0">
            {items.map((item) => {
              const isActive = item.href === activeHref;
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eurac-red/40 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-eurac-red/10 text-eurac-red"
                      : "text-slate-600 hover:bg-slate-100 hover:text-eurac-red dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-eurac-red",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </a>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
