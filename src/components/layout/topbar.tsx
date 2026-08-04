import Link from "next/link";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ATLAS_OPPORTUNITY } from "@/lib/fixtures";
import { stageLabel } from "@/components/portfolio/labels";
import { cn } from "@/lib/utils";

export function TopBar() {
  const opportunity = ATLAS_OPPORTUNITY;
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Active case
        </span>
        <span className="truncate text-sm font-semibold">{opportunity.name}</span>
        <Badge variant="outline">Synthetic</Badge>
        <span className="hidden text-xs text-muted-foreground md:inline">
          Stage {stageLabel(opportunity.stage)}
        </span>
        <span className="hidden text-xs text-muted-foreground lg:inline">
          Owner {opportunity.owner}
        </span>
      </div>
      <Link
        href="/opportunities/atlas/audit"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        aria-label="Export and decision audit trail"
      >
        <Download aria-hidden="true" />
        Export
      </Link>
    </header>
  );
}
