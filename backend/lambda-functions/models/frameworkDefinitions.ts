/**
 * Budgeting framework definitions.
 *
 * A framework is a named set of "buckets" — purpose containers with a target
 * percentage that money flows into (on income) and out of (on expense). The
 * entity is intentionally generic ("Bucket") so additional frameworks can be
 * added without renaming anything; each framework supplies its own display
 * label for its buckets (e.g. JARS calls them "Jars").
 */

export type BucketDefinition = {
    key: string;
    displayLabel: string;
    percentage: number;
    order: number;
    description: string;
};

export type FrameworkDefinition = {
    id: string;
    label: string;
    bucketLabel: string; // singular, e.g. "Jar"
    bucketLabelPlural: string; // plural, e.g. "Jars"
    buckets: BucketDefinition[];
};

/**
 * T. Harv Eker's JARS method (Secrets of a Millionaire Mind).
 * Percentages sum to 100.
 */
export const JARS_FRAMEWORK: FrameworkDefinition = {
    id: 'JARS',
    label: 'JARS Method',
    bucketLabel: 'Jar',
    bucketLabelPlural: 'Jars',
    buckets: [
        { key: 'NEC', displayLabel: 'Necessities', percentage: 55, order: 1, description: 'Food, housing, bills and everyday essentials.' },
        { key: 'FFA', displayLabel: 'Financial Freedom', percentage: 10, order: 2, description: 'Investing and wealth building — never spent (your golden goose).' },
        { key: 'LTSS', displayLabel: 'Long-Term Savings', percentage: 10, order: 3, description: 'Big purchases, emergencies and debt repayment.' },
        { key: 'EDU', displayLabel: 'Education', percentage: 10, order: 4, description: 'Books, courses and self-development.' },
        { key: 'PLAY', displayLabel: 'Play', percentage: 10, order: 5, description: 'Guilt-free indulgence — empty it regularly.' },
        { key: 'GIVE', displayLabel: 'Give', percentage: 5, order: 6, description: 'Charity, gifts and contribution.' },
    ],
};

export const FRAMEWORKS: Record<string, FrameworkDefinition> = {
    [JARS_FRAMEWORK.id]: JARS_FRAMEWORK,
};

export function getFramework(id: string): FrameworkDefinition | null {
    return FRAMEWORKS[id] ?? null;
}
