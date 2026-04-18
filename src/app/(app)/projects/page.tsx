"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Calendar,
  FolderOpen,
  Layers,
  MapPin,
  Plus,
} from "lucide-react";

const BUILDING_USE_OPTIONS = [
  { value: "RESIDENTIAL_SINGLE", label: "Residential (Single)" },
  { value: "RESIDENTIAL_MULTI", label: "Residential (Multi)" },
  { value: "OFFICE", label: "Office" },
  { value: "EDUCATION", label: "Education" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "OTHER", label: "Other" },
] as const;

const BUILDING_USE_ENUM = [
  "RESIDENTIAL_SINGLE",
  "RESIDENTIAL_MULTI",
  "OFFICE",
  "EDUCATION",
  "COMMERCIAL",
  "INDUSTRIAL",
  "OTHER",
] as const;

const createSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  city: z.string().optional(),
  buildingUse: z.enum(BUILDING_USE_ENUM),
  constructionYear: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

export default function ProjectsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects, isPending } = useQuery(
    trpc.project.list.queryOptions()
  );

  const createMutation = useMutation(
    trpc.project.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: trpc.project.list.queryKey() });
        setDialogOpen(false);
        toast.success("Project created");
        router.push(`/projects/${data.id}`);
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to create project");
      },
    })
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { buildingUse: "RESIDENTIAL_MULTI" },
    mode: "onBlur",
  });

  function onSubmit(values: CreateValues) {
    const year = values.constructionYear
      ? parseInt(values.constructionYear, 10)
      : undefined;
    createMutation.mutate({
      ...values,
      constructionYear: Number.isNaN(year) ? undefined : year,
    });
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your life-cycle cost analyses
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) reset();
          }}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My building project"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Bolzano" {...register("city")} />
              </div>

              <div className="space-y-2">
                <Label>Building use</Label>
                <Select
                  defaultValue="RESIDENTIAL_MULTI"
                  onValueChange={(v) =>
                    setValue("buildingUse", v as CreateValues["buildingUse"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_USE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constructionYear">Construction year</Label>
                <Input
                  id="constructionYear"
                  type="number"
                  placeholder="2025"
                  {...register("constructionYear")}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i} className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {projects && projects.length === 0 && (
        <GlassCard className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="text-sm text-muted-foreground">
              Create your first project to start a life-cycle cost analysis
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first project
          </Button>
        </GlassCard>
      )}

      {projects && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <GlassCard
              key={project.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold leading-tight">
                  {project.name}
                </h3>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {
                    BUILDING_USE_OPTIONS.find(
                      (o) => o.value === project.buildingUse
                    )?.label ?? project.buildingUse
                  }
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {project.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {project._count.variants} variant
                  {project._count.variants !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.updatedAt)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
