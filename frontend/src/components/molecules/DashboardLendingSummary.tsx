import { useRouter } from 'next/router';
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { Lending } from '@/types/Lending';

export default function DashboardLendingSummary({
  lendings,
}: {
  lendings: Lending[];
}) {
  const router = useRouter();
  const active = lendings.filter((l) => l.status !== 'paid');
  const totalOutstanding = active.reduce(
    (sum, l) => sum + (l.amount - l.totalPaid),
    0,
  );
  const totalLent = active.reduce((sum, l) => sum + l.amount, 0);
  const totalReceived = totalLent - totalOutstanding;

  return (
    <Card>
      <CardActionArea onClick={() => router.push('/lendings')}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <HandshakeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Active Lendings
            </Typography>
          </Stack>
          {active.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5 }}
            >
              No active lendings
            </Typography>
          ) : (
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Outstanding
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: 'warning.main' }}
                >
                  ₱{totalOutstanding.toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Received back
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'success.main' }}
                >
                  ₱{totalReceived.toLocaleString()}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mt: 0.5 }}
              >
                {active.length}{' '}
                {active.length === 1 ? 'active borrower' : 'active borrowers'}
              </Typography>
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
