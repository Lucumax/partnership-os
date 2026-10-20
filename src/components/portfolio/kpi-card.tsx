import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  detail?: ReactNode;
}

export function KpiCard({ label, value, caption, detail }: KpiCardProps) {
  return (
    <Card size="sm" className="gap-1.5">
      <CardContent className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        {caption ? (
          <div className="text-xs font-medium text-muted-foreground">{caption}</div>
        ) : null}
        {detail ? <div className="text-xs font-medium text-muted-foreground">{detail}</div> : null}
      </CardContent>
    </Card>
  );
}
