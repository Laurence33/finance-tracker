import { useRouter } from 'next/router';
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { RecurringExpense } from '@/types/RecurringExpense';

const FREQUENCY_LABEL: Record<RecurringExpense['frequency'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  as_needed: 'As needed',
};

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
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {active.slice(0, 3).map((re) => (
                  <Stack
                    key={re.name}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        mr: 1,
                      }}
                    >
                      {re.displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', flexShrink: 0 }}
                    >
                      {FREQUENCY_LABEL[re.frequency]}
                    </Typography>
                  </Stack>
                ))}
                {active.length > 3 && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled' }}
                  >
                    +{active.length - 3} more
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
