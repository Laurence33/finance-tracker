import { ElementType, ReactNode } from 'react';
import { Box, ButtonBase, Stack, SxProps, Theme, Typography } from '@mui/material';
import Money from '@/components/atoms/Money';
import { MoneyAmount } from '@/utils/money';

/**
 * A short right-aligned label marking a record as an exception — see §4 of
 * `docs/ui-patterns.md`. The colour is the caller's, because only the caller
 * knows whether the exception is destructive (`error.main`) or benign
 * (`text.disabled`).
 */
export type LedgerRowException = {
  label: ReactNode;
  /** Any sx colour token, e.g. `'error.main'` or `'text.disabled'`. */
  color: string;
};

export type LedgerRowProps = {
  /**
   * The record's headline. Clamped to two lines. Rendered inside a `Typography`
   * (a `<p>`), so keep this to text or inline nodes — the same goes for `meta`
   * and `exception.label`. Nodes that render a block (`Money`, `Typography`)
   * belong in `value`, `secondaryValue` or the slot props.
   */
  name: ReactNode;
  /**
   * One dense supporting line under the name — tags, a date, a source. Single
   * line with an ellipsis; omitted entirely (no dead space) when falsy.
   */
  meta?: ReactNode;
  /**
   * The record is in an exception state, so it recedes: the name drops to
   * `text.secondary` and the value to `text.disabled`. Pair with `exception`.
   */
  muted?: boolean;
  /**
   * The right-hand figure, rendered through `<Money>` with the ledger's value
   * typography so it never has to be restated per page.
   */
  amount?: MoneyAmount;
  /** Leading sign for `amount` — negative balances, signed movements. */
  sign?: '+' | '-';
  /**
   * Escape hatch for a value that is not a money amount. Ignored when `amount`
   * is given; the caller owns its typography.
   */
  value?: ReactNode;
  /**
   * A second value line under the main figure (`₱500 paid`, `3 of 12`). Sized
   * at `0.75rem`; pass a node with its own `sx` to colour it.
   */
  secondaryValue?: ReactNode;
  /** Exception label under the value block. Usually paired with `muted`. */
  exception?: LedgerRowException;
  /** Fixed-width slot before the name — an icon or avatar. */
  leading?: ReactNode;
  /**
   * Fixed-width slot after the value — row-level action icons. Note §2: these
   * cost ~55px of the name's budget for two, so only keep them when the name
   * column can afford it. Their presence switches the row off `<button>` (nested
   * buttons are invalid HTML), so the handlers inside must stop propagation.
   */
  trailing?: ReactNode;
  /**
   * Full-width slot below the row content — a progress meter, a sparkline. The
   * row owns the gap above it: 4px of meter plus this gap is 14px, which fits
   * inside the slack `minHeight` already reserves for a single-line row, so a
   * metered row stays exactly as tall as an unmetered one (§2 "Meter rows").
   * Don't add your own top margin — that equality is load-bearing.
   */
  footer?: ReactNode;
  /**
   * Theme colour for the figure built from `amount`, when its colour carries
   * meaning — `success.main` for an inflow in a mixed ledger, `error.main` for
   * a negative balance. The glyph follows it. Overrides the `muted` colour.
   */
  amountColor?: string;
  /** Optional. Without it the row renders as inert, non-focusable content. */
  onTap?: () => void;
  sx?: SxProps<Theme>;
};

/**
 * One row of a ledger list (§2 of `docs/ui-patterns.md`): a flexible name with
 * an optional meta line on the left, a right-aligned value on the right.
 *
 * Deliberately has no border, elevation or radius of its own — it is meant to
 * sit inside a `LedgerGroupCard` that owns the dividers, so a row can never be
 * styled independently of the group that owns it.
 */
export default function LedgerRow({
  name,
  meta,
  muted = false,
  amount,
  sign,
  value,
  secondaryValue,
  exception,
  leading,
  trailing,
  footer,
  amountColor,
  onTap,
  sx,
}: LedgerRowProps) {
  const interactive = Boolean(onTap);
  // Nested <button> is invalid HTML, so a row carrying its own action icons
  // gives up the button element. ButtonBase still applies role/tabIndex.
  const component: ElementType = interactive && !trailing ? 'button' : 'div';

  const valueNode =
    amount !== undefined ? (
      <Money
        amount={amount}
        sign={sign}
        // A semantically coloured figure needs the glyph to follow the digits,
        // or a fixed text.secondary ₱ reads as grey against green/red.
        surface={amountColor ? 'inherit' : 'default'}
        sx={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          lineHeight: 1.3,
          color: amountColor ?? (muted ? 'text.disabled' : 'text.primary'),
        }}
      />
    ) : (
      value
    );

  return (
    <ButtonBase
      component={component}
      onClick={onTap}
      disableRipple={!interactive}
      // An inert row is not a button. ButtonBase sets role="button"
      // unconditionally on a non-button component, so it has to be cleared or
      // screen readers announce a control that does nothing.
      role={interactive ? undefined : 'presentation'}
      tabIndex={interactive ? 0 : -1}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          px: 2,
          py: 1.5,
          minHeight: 62,
          transition: 'background-color 0.18s ease',
          ...(interactive
            ? { '&:hover': { bgcolor: 'action.hover' } }
            : { cursor: 'default' }),
          // A footer needs the two blocks stacked; without one the row keeps the
          // single centred child that makes a meta-less row sit centred.
          ...(footer ? { flexDirection: 'column', justifyContent: 'center' } : null),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1.5}
        sx={{ width: '100%' }}
      >
        {leading}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: muted ? 'text.secondary' : 'text.primary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            {name}
          </Typography>
          {meta ? (
            <Typography
              sx={{
                display: 'block',
                mt: 0.25,
                fontSize: '0.75rem',
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {meta}
            </Typography>
          ) : null}
        </Box>

        {(valueNode || secondaryValue || exception) && (
          <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
            {valueNode}
            {secondaryValue ? (
              <Box
                sx={{ mt: 0.25, fontSize: '0.75rem', color: 'text.secondary' }}
              >
                {secondaryValue}
              </Box>
            ) : null}
            {exception ? (
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: exception.color,
                }}
              >
                {exception.label}
              </Typography>
            ) : null}
          </Stack>
        )}

        {trailing}
      </Stack>

      {footer ? <Box sx={{ width: '100%', mt: 1.25 }}>{footer}</Box> : null}
    </ButtonBase>
  );
}
