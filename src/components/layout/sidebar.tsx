"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCheck,
  FolderKanban,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Opportunities", href: "/opportunities", icon: FolderKanban },
  { label: "Comparables", href: "/comparables", icon: Scale },
  { label: "Decision Briefs", href: "/opportunities/atlas/negotiation", icon: FileCheck },
  { label: "Audit", href: "/opportunities/atlas/audit", icon: ShieldCheck },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <div className="flex size-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground" aria-hidden="true">
          PO
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Partnership OS</div>
          <div className="text-[10px] leading-none text-muted-foreground">Valuation · Negotiation · Governance</div>
        </div>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 p-3">
        <div className="px-2.5 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace
        </div>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "")} aria-hidden="true" />
              {label}
              {active ? <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <div>Synthetic demo data</div>
        <div className="mt-0.5">Local-first MVP · no live AI</div>
      </div>
    </aside>
  );
}
