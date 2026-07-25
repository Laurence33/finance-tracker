import { ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  SxProps,
  Theme,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Money from '@/components/atoms/Money';
import { MoneyAmount } from '@/utils/money';

/**
 * The gradient hue, given as a theme palette key rather than a colour. The
 * gradient is built from that key's `main` → `dark`, so the hero can never
 * drift from `theme.ts`. Per §5, a page keeps its existing role colour —
 * `info` for recurring, `primary` for wallet/budget/dashboard, `success` for
 * assets, `warning` for lendings — so this is required, not defaulted: adopting
 * the component must never silently re-hue a screen.
 */
export type SummaryHeroHue =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type SummaryHeroStat = {
  /**
   * The figure. Sized at `1.125rem / 700` with tabular numerals. Rendered
   * inside a `Typography` (a `<p>`), so keep it to text or inline nodes. A
   * money value should go through `<Money component="span" />` rather than a
   * bare `<Money>`, which would nest a `<p>` inside a `<p>`.
   */
  value: ReactNode;
  /** Micro-label under the value, rendered uppercase. One or two words. */
  label: ReactNode;
  /** Optional glyph above the value — an overdue warning, a trend arrow. */
  icon?: ReactNode;
};

export type SummaryHeroCardProps = {
  /** Gradient hue, taken from the theme palette. See `SummaryHeroHue`. */
  hue: SummaryHeroHue;
  /**
   * The screen's title, rendered as the uppercase eyebrow. This is what lets an
   * adopting page delete its own `<Typography variant="subtitle1">` heading
   * above the list (§5, and anti-pattern 8 in §8 — don't restate a count the
   * hero already shows).
   */
  eyebrow: ReactNode;
  /**
   * An MUI icon element for the eyebrow, e.g. `<RepeatIcon />`. Sized and
   * dimmed by this component, so pass it unstyled.
   */
  icon?: ReactNode;
  /** The quiet line naming the figure — `Monthly projected`, `Total balance`. */
  label?: ReactNode;
  /**
   * The headline figure as a money amount, rendered through `<Money>` with the
   * coloured-surface glyph treatment. **Rounding is the caller's job** (§3):
   * `toLocaleString()` emits up to three fraction digits, so a derived total
   * needs `Math.round` at the call site.
   */
  amount?: MoneyAmount;
  /** Leading sign for `amount` — a negative net, a signed movement. */
  sign?: '+' | '-';
  /**
   * Escape hatch for a headline that is not a money amount — budgeting's `Off`,
   * a percentage, an em dash for "no data". Ignored when `amount` is given, and
   * rendered at the same size and weight as a money figure.
   *
   * One of `amount` or `figure` must resolve to something; with neither, the
   * figure tier renders as an empty line. The two are deliberately not a
   * discriminated union so a caller can pass `amount={on ? total : undefined}`
   * alongside a `figure` fallback for the off state.
   */
  figure?: ReactNode;
  /**
   * The honesty caption under the figure, at `0.6875rem`.
   *
   * **Required by §3 whenever the figure is a derived aggregate.** A total that
   * resolves ranges to `amountMax`, annualises a weekly commitment or skips
   * as-needed items is not "the" total, and presenting it as one is anti-pattern
   * 10. Say what it is: `upper bound · excludes as-needed`, `excludes archived`,
   * `estimate`. Omit this prop only when the figure is an exact sum of the
   * records below it.
   */
  caption?: ReactNode;
  /**
   * Up to three secondary stats, laid out to the right of the figure with
   * vertical dividers between them. Pass `[]` (or omit) and the whole right-hand
   * block is dropped, so the figure gets the full width — that is the normal
   * case for a hero that only has a headline.
   *
   * **A fourth stat is unsupported**: at 390px the figure has ~170px and each
   * stat costs ~40px plus a divider, so a fourth either crowds the figure into
   * wrapping or truncates. If a screen has four things worth showing, they
   * belong in a stat grid below the hero, not inside it.
   */
  stats?: SummaryHeroStat[];
  sx?: SxProps<Theme>;
};

/** Shared by both figure branches so `figure` matches `amount` exactly. */
const FIGURE_SX = {
  fontSize: { xs: '1.75rem', sm: '2rem' },
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
} as const;

/**
 * The one summary hero (§5 of `docs/ui-patterns.md`): one per screen, above the
 * list. A gradient card in the page's role colour, left-aligned in four tiers —
 * eyebrow, label, figure, caption — with up to three secondary stats on the
 * right.
 *
 * Depth comes from a single oversized off-canvas highlight circle clipped by
 * `overflow: 'hidden'`, never from a second gradient, and the `Card` drops its
 * border so the gradient runs to the edge.
 *
 * The eyebrow carries the screen title, which is what removes the need for a
 * separate page heading above the list.
 */
export default function SummaryHeroCard({
  hue,
  eyebrow,
  icon,
  label,
  amount,
  sign,
  figure,
  caption,
  stats = [],
  sx,
}: SummaryHeroCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={[
        {
          // §6 owns the 20px gap between the hero and the list.
          mb: 2.5,
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          background: `linear-gradient(135deg, ${theme.palette[hue].main} 0%, ${theme.palette[hue].dark} 100%)`,
          color: 'white',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* Soft highlight so the gradient reads as depth rather than a flat wash */}
      <Box
        sx={{
          position: 'absolute',
          top: -72,
          right: -48,
          width: 216,
          height: 216,
          borderRadius: '50%',
          bgcolor: alpha('#ffffff', 0.09),
        }}
      />
      <CardContent
        sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, position: 'relative' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            mb: 2,
            // Sizes the caller's unstyled icon without a wrapper element. The
            // child selector outranks `.MuiSvgIcon-fontSizeMedium`.
            '& > svg': { fontSize: 16, opacity: 0.9 },
          }}
        >
          {icon}
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.9,
            }}
          >
            {eyebrow}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            {label ? (
              <Typography
                sx={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.85 }}
              >
                {label}
              </Typography>
            ) : null}
            {amount !== undefined ? (
              <Money
                surface="onColor"
                amount={amount}
                sign={sign}
                sx={FIGURE_SX}
              />
            ) : (
              <Typography sx={FIGURE_SX}>{figure}</Typography>
            )}
            {caption ? (
              <Typography sx={{ fontSize: '0.6875rem', opacity: 0.7, mt: 0.25 }}>
                {caption}
              </Typography>
            ) : null}
          </Box>

          {stats.length > 0 ? (
            <Stack
              direction="row"
              spacing={1.75}
              // Bottom-aligned so the labels share a baseline even when only
              // some stats carry an icon — otherwise an icon-less stat rides up
              // to the top of the stretched row. `flexItem` keeps the divider
              // full height regardless.
              alignItems="flex-end"
              divider={
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: alpha('#ffffff', 0.25) }}
                />
              }
              sx={{ flexShrink: 0 }}
            >
              {stats.map((stat, index) => (
                <Stack
                  key={index}
                  alignItems="center"
                  spacing={0.25}
                  sx={{ '& > svg': { fontSize: 24, opacity: 0.9 } }}
                >
                  {stat.icon}
                  <Typography
                    sx={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: 0.8,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
