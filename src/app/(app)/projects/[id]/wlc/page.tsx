import { redirect } from "next/navigation";

export default async function WLCPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  const search = new URLSearchParams();
  if (v) search.set("v", v);
  search.set("section", "wlc");
  redirect(`/projects/${id}/construction?${search.toString()}`);
}
