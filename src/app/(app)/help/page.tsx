"use client";

import { GlassCard } from "@/components/shared/glass-card";

const HELP_SECTIONS = [
  {
    title: "Rates and discounting",
    items: [
      {
        label: "Nominal interest rate",
        copy:
          "Enter the financing or opportunity cost before inflation is removed. The app derives the real discount rate automatically.",
      },
      {
        label: "Inflation rate",
        copy:
          "Use the expected long-term inflation assumption for the study horizon. This is separate from energy price escalation.",
      },
      {
        label: "Real rate",
        copy:
          "The engine discounts future costs using the derived real rate: (1 + nominal) / (1 + inflation) - 1.",
      },
    ],
  },
  {
    title: "Areas and units",
    items: [
      {
        label: "GFA",
        copy:
          "Gross Floor Area measured to the external envelope. Use it for whole-building size checks and benchmarking.",
      },
      {
        label: "NFA",
        copy:
          "Net Floor Area after walls and major structure are excluded. This is the usable internal area.",
      },
      {
        label: "TFA",
        copy:
          "Treated Floor Area used for energy scaling and per-area LCC KPIs. It should usually be less than or equal to GFA.",
      },
      {
        label: "Percent fields",
        copy:
          "The UI shows percentages, but the engine stores decimal values. If you type 0.03, the field interprets it as 3.00%.",
      },
    ],
  },
  {
    title: "Energy and PV",
    items: [
      {
        label: "Energy source selection",
        copy:
          "Choose the delivered energy source that pays the operating cost. 'Not selected' means the row is ignored in the calculation.",
      },
      {
        label: "Dual systems",
        copy:
          "Use Source 2 only when the building genuinely mixes systems for the same end use. Leave it empty otherwise.",
      },
      {
        label: "PV production",
        copy:
          "You can enter PV as total annual production in kWh/year or as a specific value in kWh/m2/year. The results use the same calculation engine either way.",
      },
    ],
  },
  {
    title: "Construction and maintenance",
    items: [
      {
        label: "Resolved cost rule",
        copy:
          "For each detail row, the app uses the larger of material cost and unit price multiplied by area, then adds labor and other costs.",
      },
      {
        label: "EN 15459 components",
        copy:
          "Service components are variant-level maintenance items. Their lifespan and maintenance percentage drive replacement cycles and maintenance totals.",
      },
      {
        label: "Building element maintenance",
        copy:
          "This slider applies a flat annual maintenance percentage to building elements that do not use EN 15459 replacement logic.",
      },
    ],
  },
  {
    title: "Variants and results",
    items: [
      {
        label: "Clone Base",
        copy:
          "Create a new variant by copying Base when you want to edit only the differences. The app keeps a diff count so you can see how far each variant diverges.",
      },
      {
        label: "Validation summary",
        copy:
          "Preview-ready means the minimum fields for a meaningful first result are present. Publish-ready means the major sections are complete enough for reporting.",
      },
      {
        label: "Audit view",
        copy:
          "Use the audit panels in Results to understand how LCC is composed from design, construction, O&M, non-construction, and residual value.",
      },
    ],
  },
] as const;

export default function HelpCenterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Help Center</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Short reference notes for the concepts that most often slow down LCC
          studies. Use this page when a tooltip is not enough and you need the
          practical meaning of a field inside the current workflow.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {HELP_SECTIONS.map((section) => (
          <GlassCard key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="rounded-xl border bg-muted/20 p-4">
                  <div className="text-sm font-medium">{item.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h2 className="text-lg font-semibold">Worked-example pattern</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          For training and onboarding, create a project from a known case study,
          keep Base as the reference model, then clone Base for alternative
          scenarios. Use the Overview page to confirm readiness, then compare
          variants in Results once the required sections are complete.
        </p>
      </GlassCard>
    </div>
  );
}
