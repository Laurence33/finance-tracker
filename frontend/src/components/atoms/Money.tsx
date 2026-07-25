import { Box, SxProps, Theme, Typography, TypographyProps } from '@mui/material';
import {
  CURRENCY_GLYPH,
  MoneyAmount,
  formatMoneyValue,
} from '@/utils/money';

/**
 * How the glyph is de-emphasised, which depends on what the figure sits on and
 * whether the digits are themselves coloured. See §3 and §5 of
 * `docs/ui-patterns.md`.
 *
 * - `default` — body figure in a text colour on a normal surface. The glyph
 *   steps down to `text.secondary`.
 * - `inherit` — body figure whose digits carry a *semantic* colour (success
 *   green for income, error red for a negative). A fixed `text.secondary` glyph
 *   reads as a grey glyph against coloured digits, so here it inherits the
 *   caller's colour and steps down by opacity instead.
 * - `onColor` — large figure on a gradient surface. Inherits the colour and is
 *   set smaller, calibrated against the hero's display size.
 */
export type MoneySurface = 'default' | 'inherit' | 'onColor';

const GLYPH_SX: Record<MoneySurface, SxProps<Theme>> = {
  default: {
    fontSize: '0.8em',
    fontWeight: 500,
    color: 'text.secondary',
    mr: '2px',
  },
  inherit: {
    fontSize: '0.8em',
    fontWeight: 500,
    opacity: 0.7,
    mr: '2px',
  },
  onColor: {
    fontSize: '0.6em',
    fontWeight: 500,
    opacity: 0.8,
    mr: '2px',
  },
};

export type MoneyProps = Omit<TypographyProps, 'children'> & {
  /** A fixed amount, or `{ min, max }` for a compact range (`₱2,000–6,000`). */
  amount: MoneyAmount;
  /**
   * Optional leading sign, rendered before the glyph. The caller owns the
   * colour — pass `sx={{ color: 'success.main' }}` for income, and so on.
   */
  sign?: '+' | '-';
  /** @default 'default' */
  surface?: MoneySurface;
  /**
   * Set `false` to render the digits alone, keeping the tabular numerals and
   * tracking. For a second figure in a pair whose glyph the first already
   * carries — `₱1,200 / 2,000` — so the row shows one glyph, not two (§3).
   * @default true
   */
  glyph?: boolean;
};

/**
 * The one way to render a peso figure. Supplies tabular numerals, the tightened
 * tracking and the de-emphasised currency glyph; size, weight and colour stay
 * with the caller via `sx`, which is merged last so it always wins.
 */
export default function Money({
  amount,
  sign,
  surface = 'default',
  glyph = true,
  sx,
  ...rest
}: MoneyProps) {
  return (
    <Typography
      {...rest}
      sx={[
        {
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {sign}
      {glyph ? (
        <Box component="span" sx={GLYPH_SX[surface]}>
          {CURRENCY_GLYPH}
        </Box>
      ) : null}
      {formatMoneyValue(amount)}
    </Typography>
  );
}
