import { Box, Stack, Typography } from '@mui/material';
import { RecurringExpensePayment } from '@/types/RecurringExpense';
import { getPeriodLabel } from '@/utils/recurring-helpers';

export default function RecurringPaymentsList({
  payments,
  frequency,
}: {
  payments: RecurringExpensePayment[];
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed';
}) {
  if (payments.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
        No payments recorded yet
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {payments.map((payment) => (
        <Box
          key={payment.periodKey}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getPeriodLabel(frequency, payment.periodKey)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {new Date(payment.paidAt.replace(' ', 'T')).toLocaleDateString()} · {payment.fundSource}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ₱{payment.amount.toLocaleString()}
            </Typography>
          </Stack>
          {payment.notes && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {payment.notes}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}
