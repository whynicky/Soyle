import { t } from "./locale.ts";
import canonicalLabels from "../locales/aac-concepts.json" with { type: "json" };

export function scenarioCardLabel(card: { label: string; concept_key?: string }): string {
  return card.concept_key && card.concept_key in canonicalLabels ? canonicalLabels[card.concept_key as keyof typeof canonicalLabels] : card.label;
}

export type AACScenarioContent = {
  scenario_key?: string;
  title?: string;
  labels?: string[];
  instruction?: string;
  steps?: string[];
  criterion?: string;
  empty_hint?: string;
  incomplete_hint?: string;
  success_hint?: string;
  action_label?: string;
  completion?: { type: "contains_any"; accepted_labels: string[] };
  accepted_sequences?: string[][];
};

const fallbackExcludedLabels: Record<string, Set<string>> = {
  request: new Set(["Хочу"]),
  observation: new Set(["Я", "Вижу", "Играю"]),
  past_event: new Set(["Я", "Вчера", "Мяч"]),
};

function sequenceKey(labels: readonly string[]): string {
  return labels.join("\u0000");
}

export function acceptedAACScenarioSequences(content: AACScenarioContent | undefined): string[][] {
  const configured = content?.accepted_sequences?.filter((sequence) => sequence.length);
  if (configured?.length) {
    const seen = new Set<string>();
    return configured.filter((sequence) => {
      const key = sequenceKey(sequence);
      if (seen.has(key)) return false;
      seen.add(key);
      return new Set(sequence).size === sequence.length;
    });
  }

  const configuredLabels = content?.completion?.accepted_labels;
  const excluded = fallbackExcludedLabels[content?.scenario_key || ""] || new Set<string>();
  const acceptedLabels = configuredLabels?.length
    ? configuredLabels
    : (content?.labels || []).filter((label) => !excluded.has(label));
  const singleCardSequences = acceptedLabels.map((label) => [label]);
  if (content?.scenario_key === "request") {
    return [...singleCardSequences, ...acceptedLabels.map((label) => ["Хочу", label])];
  }
  if (content?.scenario_key === "observation") {
    return [
      ...singleCardSequences,
      ...acceptedLabels.map((label) => ["Вижу", label]),
      ...acceptedLabels.map((label) => ["Я", "Вижу", label]),
    ];
  }
  if (content?.scenario_key === "past_event") {
    return [...singleCardSequences, ...acceptedLabels.map((label) => ["Я", label])];
  }
  return singleCardSequences;
}

function isSameSequence(selectedLabels: readonly string[], sequence: readonly string[]): boolean {
  return selectedLabels.length === sequence.length && selectedLabels.every((label, index) => label === sequence[index]);
}

function isSequencePrefix(selectedLabels: readonly string[], sequence: readonly string[]): boolean {
  return selectedLabels.length <= sequence.length && selectedLabels.every((label, index) => label === sequence[index]);
}

export function canAddAACScenarioCard(
  content: AACScenarioContent | undefined,
  selectedLabels: readonly string[],
  nextLabel: string,
): boolean {
  if (selectedLabels.includes(nextLabel)) return false;
  const nextSelection = [...selectedLabels, nextLabel];
  return acceptedAACScenarioSequences(content).some((sequence) => isSequencePrefix(nextSelection, sequence));
}

export function evaluateAACScenario(
  content: AACScenarioContent | undefined,
  selectedLabels: readonly string[],
): { complete: boolean; hint: string; actionLabel: string; stepLabel: string } {
  const sequences = acceptedAACScenarioSequences(content);
  const complete = sequences.some((sequence) => isSameSequence(selectedLabels, sequence));
  const validPrefix = sequences.some((sequence) => isSequencePrefix(selectedLabels, sequence));
  const hint = !selectedLabels.length
    ? content?.empty_hint || t("scenario.empty")
    : complete
      ? content?.success_hint || t("scenario.ready")
      : validPrefix
        ? content?.incomplete_hint || t("scenario.add")
        : t("scenario.remove");
  return {
    complete,
    hint,
    actionLabel: content?.action_label || t("scenario.finish"),
    stepLabel: complete ? t("scenario.step2") : t("scenario.step1"),
  };
}
