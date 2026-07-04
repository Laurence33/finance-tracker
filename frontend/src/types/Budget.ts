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
  description?: string;
  bucketLabel: string; // singular, e.g. "Jar"
  bucketLabelPlural: string; // plural, e.g. "Jars"
};

export type Budget = {
  config: BudgetConfig;
  framework: FrameworkMeta | null;
  buckets: Bucket[];
};

export type BucketDefinition = {
  key: string;
  displayLabel: string;
  percentage: number;
  order: number;
  description: string;
};

/**
 * A full framework definition, fetched from GET /budget/frameworks (the backend
 * owns the list — nothing is hardcoded here). Used to preview a bucket split
 * (and seed allocations) before the framework is enabled and real bucket items
 * exist; once enabled, the seeded buckets are the source of truth.
 */
export type FrameworkDefinition = FrameworkMeta & {
  order: number;
  buckets: BucketDefinition[];
};
