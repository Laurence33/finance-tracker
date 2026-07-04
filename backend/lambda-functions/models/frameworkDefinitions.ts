/**
 * Budgeting framework seed definitions.
 *
 * A framework is a named set of "buckets" — purpose containers with a target
 * percentage that money flows into (on income) and out of (on expense). The
 * entity is intentionally generic ("Bucket") so additional frameworks can be
 * added without renaming anything; each framework supplies its own display
 * label for its buckets (e.g. JARS calls them "Jars").
 *
 * DynamoDB is the runtime source of truth (partition `FRAMEWORK`, one item per
 * framework, served by GET /budget/frameworks). The definitions below are
 * versioned seeds: FrameworkService writes any seed that is missing from the
 * table or carries a higher `version` than the stored item. To change a
 * framework here, bump its `version` or the update will never reach the table.
 * Frameworks added directly to the table (without a seed) are served as-is.
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
    description: string;
    bucketLabel: string; // singular, e.g. "Jar"
    bucketLabelPlural: string; // plural, e.g. "Jars"
    order: number; // position in the framework picker
    version: number;
    buckets: BucketDefinition[];
};

/**
 * T. Harv Eker's JARS method (Secrets of a Millionaire Mind).
 * Percentages sum to 100.
 */
export const JARS_FRAMEWORK: FrameworkDefinition = {
    id: 'JARS',
    label: 'JARS Method',
    description: "T. Harv Eker's six-jar money management system from Secrets of a Millionaire Mind.",
    bucketLabel: 'Jar',
    bucketLabelPlural: 'Jars',
    order: 1,
    version: 1,
    buckets: [
        { key: 'NEC', displayLabel: 'Necessities', percentage: 55, order: 1, description: 'Food, housing, bills and everyday essentials.' },
        { key: 'FFA', displayLabel: 'Financial Freedom', percentage: 10, order: 2, description: 'Investing and wealth building — never spent (your golden goose).' },
        { key: 'LTSS', displayLabel: 'Long-Term Savings', percentage: 10, order: 3, description: 'Big purchases, emergencies and debt repayment.' },
        { key: 'EDU', displayLabel: 'Education', percentage: 10, order: 4, description: 'Books, courses and self-development.' },
        { key: 'PLAY', displayLabel: 'Play', percentage: 10, order: 5, description: 'Guilt-free indulgence — empty it regularly.' },
        { key: 'GIVE', displayLabel: 'Give', percentage: 5, order: 6, description: 'Charity, gifts and contribution.' },
    ],
};

/** Elizabeth Warren's 50/30/20 rule (All Your Worth). */
export const FIFTY_THIRTY_TWENTY_FRAMEWORK: FrameworkDefinition = {
    id: '50-30-20',
    label: '50/30/20 Rule',
    description: 'A simple three-way split of after-tax income into needs, wants and savings.',
    bucketLabel: 'Category',
    bucketLabelPlural: 'Categories',
    order: 2,
    version: 1,
    buckets: [
        { key: 'NEEDS', displayLabel: 'Needs', percentage: 50, order: 1, description: 'Housing, utilities, groceries, transport and minimum debt payments.' },
        { key: 'WANTS', displayLabel: 'Wants', percentage: 30, order: 2, description: 'Dining out, entertainment, hobbies, shopping and subscriptions.' },
        { key: 'SAVINGS', displayLabel: 'Savings', percentage: 20, order: 3, description: 'Savings, investments and extra debt payments.' },
    ],
};

/** Richard Jenkins' 60% Solution. */
export const SIXTY_SOLUTION_FRAMEWORK: FrameworkDefinition = {
    id: '60-SOLUTION',
    label: 'The 60% Solution',
    description: 'Keep all committed expenses within 60% of income; split the rest into four 10% buckets.',
    bucketLabel: 'Category',
    bucketLabelPlural: 'Categories',
    order: 3,
    version: 1,
    buckets: [
        { key: 'COMMITTED', displayLabel: 'Committed Expenses', percentage: 60, order: 1, description: 'All bills and basic living costs, including everyday extras.' },
        { key: 'RETIREMENT', displayLabel: 'Retirement', percentage: 10, order: 2, description: 'Long-term retirement investing.' },
        { key: 'LTS', displayLabel: 'Long-Term Savings', percentage: 10, order: 3, description: 'Emergency fund, big future purchases and debt reduction.' },
        { key: 'IRREGULAR', displayLabel: 'Irregular Expenses', percentage: 10, order: 4, description: 'Repairs, gifts, vacations and other non-monthly costs.' },
        { key: 'FUN', displayLabel: 'Fun Money', percentage: 10, order: 5, description: 'Guilt-free spending on whatever you enjoy.' },
    ],
};

/** 70/20/10 rule. */
export const SEVENTY_TWENTY_TEN_FRAMEWORK: FrameworkDefinition = {
    id: '70-20-10',
    label: '70/20/10 Rule',
    description: 'Live on 70% of income, save and invest 20%, put 10% toward debt or giving.',
    bucketLabel: 'Category',
    bucketLabelPlural: 'Categories',
    order: 4,
    version: 1,
    buckets: [
        { key: 'LIVING', displayLabel: 'Living Expenses', percentage: 70, order: 1, description: 'All monthly spending — needs and wants combined.' },
        { key: 'SAVINGS', displayLabel: 'Savings & Investing', percentage: 20, order: 2, description: 'Savings, emergency fund and investments.' },
        { key: 'DEBT_GIVE', displayLabel: 'Debt & Giving', percentage: 10, order: 3, description: 'Extra debt payments, charity and gifts.' },
    ],
};

/** 80/20 "Pay Yourself First" — skim savings off the top, spend the rest freely. */
export const EIGHTY_TWENTY_FRAMEWORK: FrameworkDefinition = {
    id: '80-20',
    label: '80/20 Pay Yourself First',
    description: 'Set savings aside first, then spend the remaining 80% without detailed tracking.',
    bucketLabel: 'Category',
    bucketLabelPlural: 'Categories',
    order: 5,
    version: 1,
    buckets: [
        { key: 'SAVE', displayLabel: 'Savings', percentage: 20, order: 1, description: 'Pay yourself first — savings and investments before anything else.' },
        { key: 'SPEND', displayLabel: 'Everything Else', percentage: 80, order: 2, description: 'All living expenses, needs and wants combined.' },
    ],
};

export const FRAMEWORKS: Record<string, FrameworkDefinition> = {
    [JARS_FRAMEWORK.id]: JARS_FRAMEWORK,
    [FIFTY_THIRTY_TWENTY_FRAMEWORK.id]: FIFTY_THIRTY_TWENTY_FRAMEWORK,
    [SIXTY_SOLUTION_FRAMEWORK.id]: SIXTY_SOLUTION_FRAMEWORK,
    [SEVENTY_TWENTY_TEN_FRAMEWORK.id]: SEVENTY_TWENTY_TEN_FRAMEWORK,
    [EIGHTY_TWENTY_FRAMEWORK.id]: EIGHTY_TWENTY_FRAMEWORK,
};
