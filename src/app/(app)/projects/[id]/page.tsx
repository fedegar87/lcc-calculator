import { redirect } from "next/navigation";

export default async function ProjectIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  const query = v ? `?v=${encodeURIComponent(v)}` : "";
  redirect(`/projects/${id}/info${query}`);
}
