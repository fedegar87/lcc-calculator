"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (session) {
      router.replace("/projects");
    } else {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-bold text-primary">LCCzero</h1>
        <div className="h-1 w-8 animate-pulse rounded-full bg-primary/50" />
      </div>
    </main>
  );
}
