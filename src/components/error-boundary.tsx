"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  AlertCircle,
  Mail,
  RefreshCw,
  WifiOff,
  Clock,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyError, type LCCzeroErrorCode } from "@/lib/errors";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
  contactEmail?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const CODE_TITLE: Record<LCCzeroErrorCode, string> = {
  INVALID_INPUT: "Invalid input",
  MISSING_DATA: "Missing inputs",
  COMPUTE_TIMEOUT: "Calculation timed out",
  NETWORK: "Connection lost",
  UNKNOWN: "Something went wrong",
};

const CODE_ICON: Record<
  LCCzeroErrorCode,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  INVALID_INPUT: FileWarning,
  MISSING_DATA: FileWarning,
  COMPUTE_TIMEOUT: Clock,
  NETWORK: WifiOff,
  UNKNOWN: AlertCircle,
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    const { error } = this.state;
    if (error == null) return this.props.children;

    const contactEmail = this.props.contactEmail ?? "federico.garzia@eurac.edu";
    const subject = encodeURIComponent("LCCzero — unexpected error");
    const href =
      typeof window !== "undefined" ? window.location.href : "(unknown)";
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "(unknown)";
    const body = encodeURIComponent(
      [
        "Hi,",
        "",
        "I hit the following error in LCCzero:",
        "",
        error.message || "(no message)",
        "",
        `Page: ${href}`,
        `User agent: ${userAgent}`,
      ].join("\n"),
    );

    const code = classifyError(error);
    const Icon = CODE_ICON[code];
    const title = this.props.fallbackTitle ?? CODE_TITLE[code];

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <Icon className="size-10 text-destructive" aria-hidden={true} />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" onClick={this.handleRetry}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
          <Button
            type="button"
            variant="outline"
            render={
              <a
                href={`mailto:${contactEmail}?subject=${subject}&body=${body}`}
              />
            }
          >
            <Mail className="size-4" />
            Report issue
          </Button>
        </div>
      </div>
    );
  }
}
