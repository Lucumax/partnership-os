"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ListChecks, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_USE_LABELS,
  EXCLUSIVITY_LABELS,
  fmtMoney,
  REGULATORY_FLAG_KEYS,
  REGULATORY_FLAG_LABELS,
  REGULATORY_FLAG_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/components/valuation/format";
import { DraftValuationComparison } from "@/components/valuation/draft-comparison";
import { ATLAS_OPPORTUNITY, ATLAS_PROPOSAL, ATLAS_RECOMMENDATION } from "@/lib/fixtures";
import type {
  DataRight,
  Exclusivity,
  ProposalTerms,
  RegulatoryFlag,
  RegulatoryFlagStatus,
  SourceType,
} from "@/lib/domain/types";

const EXCLUSIVITY_OPTIONS: Array<{ value: Exclusivity; label: string }> = (
  Object.keys(EXCLUSIVITY_LABELS) as Exclusivity[]
).map((value) => ({ value, label: EXCLUSIVITY_LABELS[value] }));

const SOURCE_TYPE_OPTIONS: Array<{ value: SourceType; label: string }> = (
  Object.keys(SOURCE_TYPE_LABELS) as SourceType[]
).map((value) => ({ value, label: SOURCE_TYPE_LABELS[value] }));

const REGULATORY_STATUS_OPTIONS: Array<{ value: RegulatoryFlagStatus; label: string }> = (
  Object.keys(REGULATORY_FLAG_STATUS_LABELS) as RegulatoryFlagStatus[]
).map((value) => ({ value, label: REGULATORY_FLAG_STATUS_LABELS[value] }));

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}

function NumberField({ label, value, onChange, suffix = "$M" }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step="any"
          inputMode="decimal"
          value={String(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-8"
        />
        <span className="w-12 shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

function TextAreaField({ label, value, onChange, rows = 3, placeholder }: TextAreaFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="min-h-0"
      />
    </label>
  );
}

interface ArrayFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  rows?: number;
  placeholder?: string;
}

function ArrayField({ label, values, onChange, rows = 2, placeholder }: ArrayFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        value={values.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0),
          )
        }
        rows={rows}
        placeholder={placeholder}
        className="min-h-0"
      />
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

interface RightsTableProps {
  title: string;
  rights: DataRight[];
  onChange: (rights: DataRight[]) => void;
}

function RightsTable({ title, rights, onChange }: RightsTableProps) {
  const update = (index: number, patch: Partial<DataRight>) => {
    onChange(rights.map((right, i) => (i === index ? { ...right, ...patch } : right)));
  };
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{title}</FieldLabel>
      <div className="flex flex-col">
        {rights.map((right, index) => (
          <div
            key={right.use}
            className="flex items-center gap-2 border-b border-border py-1.5 last:border-b-0"
          >
            <span className="w-28 shrink-0 text-sm">{AI_USE_LABELS[right.use]}</span>
            <Select
              value={right.scope}
              onValueChange={(next) => update(index, { scope: next as DataRight["scope"] })}
            >
              <SelectTrigger size="sm" className="h-7 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="granted">Granted</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="negotiable">Negotiable</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={right.note ?? ""}
              placeholder="Note"
              className="h-7 flex-1"
              onChange={(event) => update(index, { note: event.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
      <Separator className="my-1" />
    </div>
  );
}

export default function ProposalPage() {
  const [draft, setDraft] = useState<ProposalTerms>(() => ({ ...ATLAS_PROPOSAL }));
  const [missingInfo, setMissingInfo] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);

  const patchProposal = (patch: Partial<ProposalTerms>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
  };

  const updateFlag = (flag: RegulatoryFlag, status: RegulatoryFlagStatus) => {
    setDraft((previous) => ({
      ...previous,
      regulatoryFlags: { ...(previous.regulatoryFlags ?? {}), [flag]: status },
    }));
  };

  const saveDraft = () => {
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const markComplete = () => {
    setIntakeComplete(true);
  };

  const totalCost =
    draft.upfrontCashUsd + (draft.termMonths / 12) * (draft.annualLicenseFeeUsd + draft.annualMinimumUsageUsd);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <a
          href="/opportunities/atlas"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-3" aria-hidden="true" /> Atlas opportunity
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Proposal intake</h1>
          <Badge variant="secondary">Synthetic</Badge>
          <Badge variant="outline">{ATLAS_OPPORTUNITY.name}</Badge>
          <Badge variant="outline">Draft — not applied to the seeded case</Badge>
          {intakeComplete ? <Badge>Intake complete</Badge> : null}
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Capture the terms Atlas actually proposed. Edits below are a local draft for exploring
          the model — the &ldquo;with your edits&rdquo; panel runs them through the real valuation
          engine so you can see how it responds, but the draft does not overwrite the seeded case
          that the valuation, negotiation, and audit screens read from. Edits stay in your browser
          — nothing is saved to a server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Economic terms">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Cash consideration (total)"
                value={draft.cashConsiderationUsd}
                onChange={(value) => patchProposal({ cashConsiderationUsd: value })}
              />
              <NumberField
                label="Upfront payment"
                value={draft.upfrontCashUsd}
                onChange={(value) => patchProposal({ upfrontCashUsd: value })}
              />
              <NumberField
                label="Annual license fee"
                value={draft.annualLicenseFeeUsd}
                onChange={(value) => patchProposal({ annualLicenseFeeUsd: value })}
              />
              <NumberField
                label="Annual minimum usage"
                value={draft.annualMinimumUsageUsd}
                onChange={(value) => patchProposal({ annualMinimumUsageUsd: value })}
              />
              <NumberField
                label="Implementation support"
                value={draft.implementationSupportUsd}
                onChange={(value) => patchProposal({ implementationSupportUsd: value })}
              />
              <NumberField
                label="Minimum commitment (term)"
                value={draft.minimumCommitmentUsd ?? 0}
                onChange={(value) => patchProposal({ minimumCommitmentUsd: value })}
              />
              <NumberField
                label="Usage commitment / yr"
                value={draft.usageCommitment ?? 0}
                onChange={(value) => patchProposal({ usageCommitment: value })}
              />
            </div>
          </Section>

          <Section title="Rights">
            <RightsTable
              title="Data rights"
              rights={draft.dataRights ?? []}
              onChange={(rights) => patchProposal({ dataRights: rights })}
            />
            <RightsTable
              title="Product rights"
              rights={draft.productRights ?? []}
              onChange={(rights) => patchProposal({ productRights: rights })}
            />
          </Section>

          <Section title="Term and renewal">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
                label="Term"
                value={draft.termMonths}
                onChange={(value) => patchProposal({ termMonths: value })}
                suffix="months"
              />
            </div>
            <TextAreaField
              label="Renewal mechanics"
              value={draft.renewalMechanics ?? ""}
              onChange={(value) => patchProposal({ renewalMechanics: value })}
              rows={2}
            />
            <TextAreaField
              label="Termination rights"
              value={draft.terminationRights ?? ""}
              onChange={(value) => patchProposal({ terminationRights: value })}
              rows={2}
            />
          </Section>

          <Section title="Exclusivity">
            <SelectField
              label="Exclusivity"
              value={draft.exclusivity}
              options={EXCLUSIVITY_OPTIONS}
              onChange={(value) => patchProposal({ exclusivity: value })}
            />
            <ArrayField
              label="Territory"
              values={draft.territory ?? []}
              onChange={(value) => patchProposal({ territory: value })}
              placeholder="One territory per line"
            />
          </Section>

          <Section title="Usage and distribution obligations">
            <ArrayField
              label="Distribution commitments"
              values={draft.distributionCommitments ?? []}
              onChange={(value) => patchProposal({ distributionCommitments: value })}
              placeholder="One commitment per line"
            />
            {draft.nonCashValueNotes ? (
              <p className="text-xs text-muted-foreground">{draft.nonCashValueNotes}</p>
            ) : null}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Implementation obligations">
            <ArrayField
              label="Implementation obligations"
              values={draft.implementationObligations ?? []}
              onChange={(value) => patchProposal({ implementationObligations: value })}
              placeholder="One obligation per line"
            />
          </Section>

          <Section title="Legal and policy flags">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Regulatory screening</FieldLabel>
              <div className="flex flex-col">
                {REGULATORY_FLAG_KEYS.map((flag) => {
                  const status = draft.regulatoryFlags?.[flag] ?? "not_applicable";
                  return (
                    <div
                      key={flag}
                      className="flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-b-0"
                    >
                      <span className="text-sm">{REGULATORY_FLAG_LABELS[flag]}</span>
                      <Select
                        value={status}
                        onValueChange={(next) => updateFlag(flag, next as RegulatoryFlagStatus)}
                      >
                        <SelectTrigger size="sm" className="h-7 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGULATORY_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Evidence source">
            <div className="grid grid-cols-1 gap-3">
              <SelectField
                label="Source type"
                value={draft.sourceType}
                options={SOURCE_TYPE_OPTIONS}
                onChange={(value) => patchProposal({ sourceType: value })}
              />
              <label className="flex flex-col gap-1">
                <FieldLabel>Source label</FieldLabel>
                <Input
                  value={draft.sourceLabel}
                  onChange={(event) => patchProposal({ sourceLabel: event.target.value })}
                  className="h-8"
                />
              </label>
            </div>
          </Section>

          <Section title="Missing information">
            <TextAreaField
              label="Missing information"
              value={missingInfo}
              onChange={setMissingInfo}
              rows={4}
              placeholder="Terms or evidence still outstanding"
            />
          </Section>
        </div>
      </div>

      <DraftValuationComparison draft={draft} />

      {showQuestions ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">What still needs evidence</CardTitle>
            <CardDescription>
              Auto-generated from the seeded recommendation — no live AI at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-4 text-sm">
              {ATLAS_RECOMMENDATION.missingEvidence.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {savedAt ? (
            <Badge variant="outline">Draft saved {savedAt}</Badge>
          ) : (
            <span>Draft not saved</span>
          )}
          {intakeComplete ? (
            <Badge>Intake complete</Badge>
          ) : (
            <span>Intake pending</span>
          )}
          <span className="tabular-nums">
            Draft nominal cost (upfront + annual x term) {fmtMoney(totalCost)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={saveDraft}>
            <Save className="size-4" aria-hidden="true" /> Save draft
          </Button>
          <Button variant="secondary" onClick={() => setShowQuestions((value) => !value)}>
            <ListChecks className="size-4" aria-hidden="true" /> Show diligence questions
          </Button>
          <Button
            variant={intakeComplete ? "secondary" : "default"}
            onClick={markComplete}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />{" "}
            {intakeComplete ? "Intake complete" : "Mark intake complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
