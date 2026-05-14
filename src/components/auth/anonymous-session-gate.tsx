"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AnonymousSessionGate({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [anonymousReady, setAnonymousReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    if (isPending || session || anonymousReady || isCreatingRef.current) {
      return;
    }

    let cancelled = false;
    isCreatingRef.current = true;
    setErrorMessage(null);

    authClient.signIn
      .anonymous()
      .then(async ({ error }) => {
        if (error) {
          throw new Error(error.message ?? "Could not open the workspace.");
        }
        if (!cancelled) {
          setAnonymousReady(true);
        }
        await refetch();
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          isCreatingRef.current = false;
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not open the workspace.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [anonymousReady, isPending, refetch, retryToken, session]);

  if (session || anonymousReady) {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Opening workspace</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage ?? "Preparing an anonymous session..."}
          </p>
        </div>
        {errorMessage && (
          <Button
            type="button"
            onClick={() => {
              setAnonymousReady(false);
              setErrorMessage(null);
              isCreatingRef.current = false;
              setRetryToken((value) => value + 1);
            }}
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
