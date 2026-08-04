"use client";

import type { ReactNode } from "react";
import { PARTNERSHIP_ARCHETYPES } from "@/lib/fixtures";
import type { Archetype, Exclusivity } from "@/lib/domain/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXCLUSIVITY_LABELS } from "../valuation/format";

export type TermFilter = "all" | "le24" | "25to36" | "gt36" | "na";
export type ProvenanceFilter = "all" | "synthetic" | "public";
export type ComparabilityFilter = "all" | "0.5" | "0.6" | "0.7" | "0.8" | "0.9";
export type SourceQualityFilter = "all" | "3" | "4" | "5";

export interface ComparableFilters {
  archetype: Archetype | "all";
  term: TermFilter;
  exclusivity: Exclusivity | "all";
  minSourceQuality: SourceQualityFilter;
  provenance: ProvenanceFilter;
  minComparability: ComparabilityFilter;
}

export const DEFAULT_FILTERS: ComparableFilters = {
  archetype: "all",
  term: "all",
  exclusivity: "all",
  minSourceQuality: "all",
  provenance: "all",
  minComparability: "all",
};

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

interface FiltersBarProps {
  filters: ComparableFilters;
  onChange: (patch: Partial<ComparableFilters>) => void;
}

const TERM_OPTIONS: Array<{ value: TermFilter; label: string }> = [
  { value: "all", label: "Any term" },
  { value: "le24", label: "≤ 24 months" },
  { value: "25to36", label: "25–36 months" },
  { value: "gt36", label: "> 36 months" },
  { value: "na", label: "Not disclosed" },
];

const QUALITY_OPTIONS: Array<{ value: SourceQualityFilter; label: string }> = [
  { value: "all", label: "Any source quality" },
  { value: "3", label: "≥ 3 / 5" },
  { value: "4", label: "≥ 4 / 5" },
  { value: "5", label: "= 5 / 5" },
];

const PROVENANCE_OPTIONS: Array<{ value: ProvenanceFilter; label: string }> = [
  { value: "all", label: "All provenance" },
  { value: "synthetic", label: "Synthetic only" },
  { value: "public", label: "Public only" },
];

const COMPARABILITY_OPTIONS: Array<{ value: ComparabilityFilter; label: string }> = [
  { value: "all", label: "Any score" },
  { value: "0.5", label: "≥ 0.50" },
  { value: "0.6", label: "≥ 0.60" },
  { value: "0.7", label: "≥ 0.70" },
  { value: "0.8", label: "≥ 0.80" },
  { value: "0.9", label: "≥ 0.90" },
];

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterField label="Archetype">
        <Select
          value={filters.archetype}
          onValueChange={(value) => onChange({ archetype: value as Archetype | "all" })}
        >
          <SelectTrigger size="sm" className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All archetypes</SelectItem>
            {PARTNERSHIP_ARCHETYPES.map((archetype) => (
              <SelectItem key={archetype.id} value={archetype.id}>
                {archetype.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Term">
        <Select
          value={filters.term}
          onValueChange={(value) => onChange({ term: value as TermFilter })}
        >
          <SelectTrigger size="sm" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Exclusivity">
        <Select
          value={filters.exclusivity}
          onValueChange={(value) => onChange({ exclusivity: value as Exclusivity | "all" })}
        >
          <SelectTrigger size="sm" className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any exclusivity</SelectItem>
            {(Object.keys(EXCLUSIVITY_LABELS) as Exclusivity[]).map((level) => (
              <SelectItem key={level} value={level}>
                {EXCLUSIVITY_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Source quality">
        <Select
          value={filters.minSourceQuality}
          onValueChange={(value) => onChange({ minSourceQuality: value as SourceQualityFilter })}
        >
          <SelectTrigger size="sm" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Provenance">
        <Select
          value={filters.provenance}
          onValueChange={(value) => onChange({ provenance: value as ProvenanceFilter })}
        >
          <SelectTrigger size="sm" className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVENANCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Comparability">
        <Select
          value={filters.minComparability}
          onValueChange={(value) => onChange({ minComparability: value as ComparabilityFilter })}
        >
          <SelectTrigger size="sm" className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARABILITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </div>
  );
}
