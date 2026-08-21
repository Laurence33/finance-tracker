# Finance Tracker

A single-user personal finance tracker: a mobile-first Next.js frontend over a serverless
API (API Gateway + Lambda + a single DynamoDB table), with Cognito for identity.

## Language

### Money movement

**Expense**:
Money leaving the user, recorded against a Fund Source and optionally a Tag and a Bucket.
_Avoid_: Spending, outgoing, debit

**Income**:
Money arriving, recorded against a Fund Source.
_Avoid_: Earnings, credit, revenue

**Transfer**:
A movement of money between two Fund Sources. A Transfer may carry a fee, which is
recorded as an Expense in its own right.
_Avoid_: Move, payment

**Fund Source**:
An account money sits in or is charged against — a bank account, a wallet, a credit card.
Carries a balance, and a credit card is a Fund Source whose balance may go negative.
_Avoid_: Account, wallet, source

### Obligations

**Lending**:
Money the user has lent out to a borrower, drawn down by Lending Payments as it is repaid.
_Avoid_: Loan — reserved for a future feature covering money the user *owes*. Also avoid
debt, receivable.

**Recurring Expense**:
A repeating obligation the user records once and then settles period by period. Settling one
creates a Recurring Expense Payment and an Expense.
_Avoid_: Subscription, bill, standing order

**Asset**:
Something the user owns and values, tracked separately from Fund Source balances.
_Avoid_: Holding, investment, property

### Budgeting

**Framework**:
A named budgeting scheme owned by the backend and seeded into the database — JARS,
50/30/20, and so on. A user opts into at most one.
_Avoid_: Method, template, plan

**Bucket**:
One division of a Framework that a user allocates money to. Buckets hold cumulative
balances that deliberately diverge from cash: an Expense charged to a Bucket draws it down,
and deleting that Expense refunds it.
_Avoid_: Envelope, category, jar, pot — "jar" in particular belongs to the JARS Framework
and must not become the generic term.

**Tag**:
A user-defined label on an Expense, optionally carrying its own budget. Independent of
Buckets — a single Expense may have both.
_Avoid_: Category, label

### Client-side caching

**Staleness class**:
A group of endpoints sharing one freshness lifetime, from ∞ for Framework definitions down
to minutes for balances. The classification is the client's policy, not the API's — nothing
in a response declares it.
_Avoid_: Cache level, tier, TTL group

**Cache namespace**:
The per-identity partition a persisted client cache is stored under, keyed by Cognito sub,
so a signed-out user's records are unreachable to whoever signs in next on that device.
_Avoid_: Cache key, bucket — "Bucket" is a budgeting term here and must not be reused.

**Invalidation map**:
The record of which cached endpoints a given mutation makes wrong. It is derived from what
the backend actually writes in one transaction, not from what a screen happens to display.
_Avoid_: Refresh list, cache busting
