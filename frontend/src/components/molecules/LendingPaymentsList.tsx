import { Box, Stack, Typography } from '@mui/material';
import { LendingPayment } from '@/types/Lending';

export default function LendingPaymentsList({
  payments,
}: {
  payments: LendingPayment[];
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
          key={payment.timestamp}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ₱{payment.amount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {new Date(payment.timestamp.replace(' ', 'T')).toLocaleDateString()} ·{' '}
                {payment.addedToBalance === false
                  ? `${payment.fundSource} (not added to balance)`
                  : `to ${payment.fundSource}`}
              </Typography>
            </Box>
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
