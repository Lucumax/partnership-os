"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Disclosure badge for portfolio rows that are NOT fully modeled. Kept on one line so
 * every surface that renders a portfolio row discloses the same thing. Only Atlas
 * Knowledge Systems is modeled end-to-end in this demo.
 */
export function PortfolioOnlyBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<Badge variant="outline" className="text-muted-foreground" tabIndex={0} />}
        >
          Portfolio view only
        </TooltipTrigger>
        <TooltipContent side="top">
          Only Atlas Knowledge Systems is modeled end-to-end in this demo; the other cases
          populate portfolio-level views.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
