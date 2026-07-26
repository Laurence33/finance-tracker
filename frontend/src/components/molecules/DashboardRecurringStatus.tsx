import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import Money from '@/components/atoms/Money';
import { RecurringExpense } from '@/types/RecurringExpense';
import { getRecurringAmount } from '@/utils/recurring-helpers';

const FREQUENCY_LABEL: Record<RecurringExpense['frequency'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  as_needed: 'As needed',
};

const PREVIEW_LIMIT = 3;

export default function DashboardRecurringStatus({
  recurringExpenses,
}: {
  recurringExpenses: RecurringExpense[];
}) {
  const router = useRouter();
  const active = recurringExpenses.filter((re) => re.status === 'active');

  return (
    <Card>
      <CardActionArea onClick={() => router.push('/recurring')}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <RepeatIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Recurring Expenses
            </Typography>
          </Stack>
          {active.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5 }}
            >
              No active recurring expenses
            </Typography>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {active.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary' }}
              >
                {active.length === 1 ? 'active commitment' : 'active commitments'}
              </Typography>
              {/*
                A widget mini-list, not a ledger group (§2): it borrows the row's
                name-left / value-right alignment and its tabular figures, but
                keeps the widget's own density and carries no group header or
                count. The frequency moved off the value rail and under the name
                so the rail holds a figure, which is what makes the three amounts
                line up as a column.
              */}
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {active.slice(0, PREVIEW_LIMIT).map((re) => (
                  <Stack
                    key={re.name}
                    direction="row"
                    alignItems="flex-start"
                    spacing={1.5}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {re.displayName}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          lineHeight: 1.3,
                        }}
                      >
                        {FREQUENCY_LABEL[re.frequency]}
                      </Typography>
                    </Box>
                    <Money
                      amount={getRecurringAmount(re)}
                      sx={{
                        flexShrink: 0,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    />
                  </Stack>
                ))}
                {active.length > PREVIEW_LIMIT && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled' }}
                  >
                    +{active.length - PREVIEW_LIMIT} more
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
