import { ReactNode } from 'react';
import {
  Card,
  Divider,
  Stack,
  SxProps,
  Theme,
  Typography,
  alpha,
  keyframes,
  useTheme,
} from '@mui/material';

// Defined with MUI's `keyframes` helper on purpose. A `'@keyframes name'` key
// inside `sx` does not reliably resolve the animation name, and with `both`
// fill-mode the card stays at `opacity: 0` — a blank list that still occupies
// layout space. See §7 of `docs/ui-patterns.md`.
const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

export type LedgerGroupCardProps = {
  /** The eyebrow, rendered uppercase. Keep it to the grouped-by field's value. */
  label: ReactNode;
  /** Rendered on the right as `N item` / `N items`. */
  count?: number;
  /**
   * Replaces the whole right-hand slot when a group needs to say something
   * other than a count. The caller owns its typography — the node is rendered
   * as given, so it may be a `Typography` or a `Money` of its own.
   */
  /**
   * Position in the list of groups; drives the entrance stagger (70ms each).
   * @default 0
   */
  index?: number;
  /** The rows. Pass a flat list — dividers go between direct children. */
  children: ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * One group of a ledger list (§2 of `docs/ui-patterns.md`): an uppercase
 * eyebrow with a count, then the rows separated by full-bleed dividers.
 *
 * The card owns the dividers and the entrance animation so rows stay
 * unstyleable on their own and the stagger applies to top-level blocks only.
 */
export default function LedgerGroupCard({
  label,
  count,
  index = 0,
  children,
  sx,
}: LedgerGroupCardProps) {
  const theme = useTheme();
  const countText =
    count === undefined ? null : `${count} ${count === 1 ? 'item' : 'items'}`;

  return (
    <Card
      sx={[
        {
          overflow: 'hidden',
          animation: `${riseIn} 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) both`,
          animationDelay: `${index * 70}ms`,
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'primary.dark',
          }}
        >
          {label}
        </Typography>
        {countText === null ? null : (
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'text.secondary',
            }}
          >
            {countText}
          </Typography>
        )}
      </Stack>

      <Stack divider={<Divider />}>{children}</Stack>
    </Card>
  );
}
