"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ChevronUp,
  FolderOpen,
  LogOut,
  Plus,
  User,
} from "lucide-react";

export function ProjectSidebar() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isAnonymous = Boolean(user?.isAnonymous);
  const displayName = isAnonymous ? "Guest workspace" : user?.name ?? "User";
  const displayDetail = isAnonymous ? "Anonymous session" : user?.email ?? "";
  const { data: projects, isPending } = useQuery(
    trpc.project.list.queryOptions()
  );

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">LCCzero</span>
                <span className="text-xs text-muted-foreground">
                  LCC Calculator
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/projects" />}>
                  <Plus className="size-4" />
                  <span>New Project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isPending &&
                Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}

              {projects?.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    tooltip={project.name}
                    render={<Link href={`/projects/${project.id}`} />}
                  >
                    <FolderOpen className="size-4" />
                    <span className="truncate">{project.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    {project._count.variants}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))}

              {projects && projects.length === 0 && (
                <SidebarMenuItem>
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    No projects yet
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" />
                }
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <User className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="truncate text-sm font-medium">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayDetail}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem disabled>
                  <User className="mr-2 size-4" />
                  {isAnonymous ? "Temporary browser workspace" : user?.email ?? "Account"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  {isAnonymous ? "Reset session" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
