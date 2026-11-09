"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ProjectSidebar } from "@/components/project/project-sidebar";
import { Separator } from "@/components/ui/separator";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { AnonymousSessionGate } from "@/components/auth/anonymous-session-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnonymousSessionGate>
      <SidebarProvider>
        <ProjectSidebar />
        <SidebarInset className="relative isolate bg-transparent print:bg-white">
          <AmbientBackground />
          <header className="material-bar sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/80 px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Save status badge slot -- filled by child pages via portal or context */}
            <div id="header-slot" className="flex flex-1 items-center" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 print:overflow-visible print:p-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AnonymousSessionGate>
  );
}
