"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OpportunityTab {
  label: string;
  href: string;
}

const OPPORTUNITY_TABS: OpportunityTab[] = [
  { label: "Overview", href: "/opportunities/atlas" },
  { label: "Proposal", href: "/opportunities/atlas/proposal" },
  { label: "Valuation", href: "/opportunities/atlas/valuation" },
  { label: "Comparables", href: "/comparables" },
  { label: "Negotiation", href: "/opportunities/atlas/negotiation" },
  { label: "Decision history", href: "/opportunities/atlas/audit" },
];

function matches(href: string, pathname: string): boolean {
  if (href === "/comparables") {
    return pathname === "/comparables" || pathname.startsWith("/comparables/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function activeTabValue(pathname: string): string {
  const match = OPPORTUNITY_TABS.find((tab) => matches(tab.href, pathname));
  return match ? match.href : "/opportunities/atlas";
}

export function OpportunityTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const value = activeTabValue(pathname);

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          router.push(nextValue);
        }
      }}
    >
      <TabsList variant="line" className="w-full justify-start rounded-none border-b">
        {OPPORTUNITY_TABS.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} render={<Link href={tab.href} />}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
