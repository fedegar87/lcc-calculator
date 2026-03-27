"use client";

import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

const STATUS_CONFIG = {
  saving: {
    icon: Loader2,
    label: "Saving...",
    variant: "secondary" as const,
    className: "animate-pulse",
    iconClassName: "animate-spin",
  },
  saved: {
    icon: Check,
    label: "Saved",
    variant: "secondary" as const,
    className: "text-green-600",
    iconClassName: "",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "destructive" as const,
    className: "",
    iconClassName: "",
  },
} as const;

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const { icon: Icon, label, variant, className, iconClassName } =
    STATUS_CONFIG[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className={cn("mr-1 h-3 w-3", iconClassName)} />
      {label}
    </Badge>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
