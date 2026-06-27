export type Bucket = {
  key: string;
  displayLabel: string;
  percentage: number;
  order: number;
  balance: number;
};

export type BudgetConfig = {
  enabled: boolean;
  framework: string;
};

export type FrameworkMeta = {
  id: string;
  label: string;
  bucketLabel: string; // singular, e.g. "Jar"
  bucketLabelPlural: string; // plural, e.g. "Jars"
};

export type Budget = {
  config: BudgetConfig;
  framework: FrameworkMeta | null;
  buckets: Bucket[];
};

export type FrameworkTemplate = FrameworkMeta & {
  /** Bucket definitions with zero balances — used to preview a split before enabling. */
  buckets: Bucket[];
};

/**
 * Client-side framework templates. Mirrors the backend `frameworkDefinitions`,
 * letting the budget page preview the bucket split (and seed allocations) before
 * the framework is enabled and real bucket items exist. The backend remains the
 * source of truth once enabled.
 */
export const FRAMEWORK_TEMPLATES: Record<string, FrameworkTemplate> = {
  JARS: {
    id: 'JARS',
    label: 'JARS Method',
    bucketLabel: 'Jar',
    bucketLabelPlural: 'Jars',
    buckets: [
      { key: 'NEC', displayLabel: 'Necessities', percentage: 55, order: 1, balance: 0 },
      { key: 'FFA', displayLabel: 'Financial Freedom', percentage: 10, order: 2, balance: 0 },
      { key: 'LTSS', displayLabel: 'Long-Term Savings', percentage: 10, order: 3, balance: 0 },
      { key: 'EDU', displayLabel: 'Education', percentage: 10, order: 4, balance: 0 },
      { key: 'PLAY', displayLabel: 'Play', percentage: 10, order: 5, balance: 0 },
      { key: 'GIVE', displayLabel: 'Give', percentage: 5, order: 6, balance: 0 },
    ],
  },
};

/** Frameworks the user can choose from in the budget settings. */
export const AVAILABLE_FRAMEWORKS: { id: string; label: string }[] = [
  { id: 'JARS', label: 'JARS Method (6 Jars)' },
];
