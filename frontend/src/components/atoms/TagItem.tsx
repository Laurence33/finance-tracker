import { Box, LinearProgress, Typography, alpha, useTheme } from '@mui/material';
import LedgerRow from '@/components/atoms/LedgerRow';
import Money from '@/components/atoms/Money';
import { Tags } from '@/types/Tags';
import { computeBudgetStatus } from '@/utils/budget-helpers';
import { formatMoneyValue } from '@/utils/money';

/** Shared by both halves of the value so `/ 2,000` sits on the spend's baseline. */
const VALUE_SX = {
  fontSize: '0.9375rem',
  lineHeight: 1.3,
} as const;

/**
 * Binds a tag to the shared ledger row. All the vocabulary lives here — that a
 * tag's figure is spend for the selected month, that `budget` is optional, and
 * that being over it is the one exception state; `LedgerRow` knows none of it.
 *
 * The meter goes in the `footer` slot (§2 "Meter rows"): 4px of bar plus
 * `mt: 1.25` is 14px, which fits inside the slack `minHeight: 62` already
 * reserves for a single-line row — so a metered row is exactly as tall as an
 * unmetered one. That is also why the value stays on **one** line
 * (`₱1,200 / 2,000`) rather than using `amount` + `secondaryValue`, which would
 * push the row to ~78px and stop it reading as a ledger row.
 */
export default function TagItem({
  tag,
  spent = 0,
  onTap,
}: {
  tag: Tags;
  spent?: number;
  onTap: (tag: Tags) => void;
}) {
  const theme = useTheme();
  // §3 — rounding is the caller's job. `spent` is a raw sum of expense amounts.
  const status = computeBudgetStatus(Math.round(spent), tag.budget ?? 0);
  const hasBudget = status.budget > 0;

  return (
    <LedgerRow
      name={tag.name}
      // One glyph for the pair (§3): the budget's digits come from
      // `formatMoneyValue`, which exists for exactly this — a second figure
      // whose glyph is already carried by the first.
      value={
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Money
            component="span"
            amount={status.spent}
            sx={{ ...VALUE_SX, fontWeight: 700 }}
          />
          {hasBudget ? (
            <Typography
              component="span"
              sx={{
                ...VALUE_SX,
                ml: '4px',
                fontWeight: 500,
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}
            >
              / {formatMoneyValue(status.budget)}
            </Typography>
          ) : null}
        </Box>
      }
      // Deliberately not `muted`: §4's muting is for records that should recede
      // (completed, cancelled), and an over-budget tag is the opposite — it is
      // the one row on the screen the user needs to look at.
      exception={
        status.isOver
          ? { label: 'Over budget', color: 'error.main' }
          : undefined
      }
      // No budget means no meter and no placeholder track. Omitting `footer`
      // drops `LedgerRow` back to its centred single-child layout, so the row is
      // the same height as a metered one with no dead space where a bar would be.
      footer={
        hasBudget ? (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, status.percentUsed)}
            // Colour encodes state, length encodes magnitude — so there is no
            // amber "nearing budget" tier. The bar's length already says how
            // close it is; because it clamps at 100%, colour is the only channel
            // left to distinguish at-budget from far over it.
            color={status.isOver ? 'error' : 'primary'}
            sx={{
              mt: 1.25,
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.09),
              '& .MuiLinearProgress-bar': { borderRadius: 2 },
            }}
          />
        ) : undefined
      }
      onTap={() => onTap(tag)}
    />
  );
}
