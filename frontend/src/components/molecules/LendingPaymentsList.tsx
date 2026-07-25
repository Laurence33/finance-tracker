import { Box, Stack, Typography } from '@mui/material';
import { LendingPayment } from '@/types/Lending';
import Money from '@/components/atoms/Money';

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
              <Money
                variant="body2"
                amount={payment.amount}
                sx={{ fontWeight: 600 }}
              />
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
