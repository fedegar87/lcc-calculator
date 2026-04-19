import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PubType = "journal" | "conference" | "report";

const TYPE_BADGE: Record<PubType, string> = {
  journal: "bg-eurac-red/10 text-eurac-red ring-eurac-red/20",
  conference: "bg-fin-100 text-fin-700 ring-fin-200/60",
  report: "bg-construction-100 text-construction-700 ring-construction-200/60",
};

export interface PublicationCardProps {
  title: string;
  journal: string;
  description: string;
  link?: string;
  type: PubType;
}

export function PublicationCard({
  title,
  journal,
  description,
  link,
  type,
}: PublicationCardProps) {
  const inner = (
    <>
      <header className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
            TYPE_BADGE[type],
          )}
        >
          {type}
          <span className="text-slate-400">·</span>
          <span className="font-semibold normal-case tracking-normal text-slate-600">
            {journal}
          </span>
        </span>
        {link ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-eurac-red" />
        ) : null}
      </header>
      <h4 className="mt-2 text-sm font-bold leading-snug tracking-tight text-slate-900 transition group-hover:text-eurac-red dark:text-slate-50">
        {title}
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </>
  );

  const className =
    "group block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900";

  return link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {inner}
    </a>
  ) : (
    <article className={className}>{inner}</article>
  );
}
