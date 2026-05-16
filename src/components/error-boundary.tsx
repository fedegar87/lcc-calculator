"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
  contactEmail?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

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

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
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
