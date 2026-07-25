import { Box, SxProps, Theme, Typography, TypographyProps } from '@mui/material';
import {
  CURRENCY_GLYPH,
  MoneyAmount,
  formatMoneyValue,
} from '@/utils/money';

/**
 * Which kind of background the figure sits on. On a normal surface the glyph
 * is de-emphasised with `text.secondary`; on a coloured/gradient surface there
 * is no theme text colour that works, so it is de-emphasised with opacity and
 * set smaller against the larger display size. See §3 and §5 of
 * `docs/ui-patterns.md`.
 */
export type MoneySurface = 'default' | 'onColor';

const GLYPH_SX: Record<MoneySurface, SxProps<Theme>> = {
  default: {
    fontSize: '0.8em',
    fontWeight: 500,
    color: 'text.secondary',
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
      <Box component="span" sx={GLYPH_SX[surface]}>
        {CURRENCY_GLYPH}
      </Box>
      {formatMoneyValue(amount)}
    </Typography>
  );
}
