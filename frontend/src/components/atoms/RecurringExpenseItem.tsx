import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { RecurringExpense } from '@/types/RecurringExpense';
import { getAmountValueDisplay } from '@/utils/recurring-helpers';

const STATUS_LABEL: Record<RecurringExpense['status'], string> = {
  active: '',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * A single ledger row. Deliberately has no Card / border of its own — it is
 * meant to sit inside a frequency-grouped card that owns the dividers, so the
 * frequency never has to be repeated on every row.
 */
export default function RecurringExpenseItem({
  recurringExpense,
  onTap,
}: {
  recurringExpense: RecurringExpense;
  onTap: (re: RecurringExpense) => void;
}) {
  const isActive = recurringExpense.status === 'active';
  const statusLabel = STATUS_LABEL[recurringExpense.status];
  const meta = recurringExpense.tags.join(' · ');

  return (
    <ButtonBase
      onClick={() => onTap(recurringExpense)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        px: 2,
        py: 1.5,
        minHeight: 62,
        transition: 'background-color 0.18s ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1.5}
        sx={{ width: '100%' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: isActive ? 'text.primary' : 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            {recurringExpense.displayName}
          </Typography>
          {meta && (
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
          )}
        </Box>

        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              color: isActive ? 'text.primary' : 'text.disabled',
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: '0.8em',
                fontWeight: 500,
                color: 'text.secondary',
                mr: '2px',
              }}
            >
              ₱
            </Box>
            {getAmountValueDisplay(recurringExpense)}
          </Typography>
          {statusLabel && (
            <Typography
              sx={{
                mt: 0.25,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:
                  recurringExpense.status === 'cancelled'
                    ? 'error.main'
                    : 'text.disabled',
              }}
            >
              {statusLabel}
            </Typography>
          )}
        </Stack>
      </Stack>
    </ButtonBase>
  );
}
