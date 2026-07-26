import { useRouter } from 'next/router';
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import Money from '@/components/atoms/Money';
import { Lending } from '@/types/Lending';
import { getLendingRemaining } from '@/utils/lending-helpers';

export default function DashboardLendingSummary({
  lendings,
}: {
  lendings: Lending[];
}) {
  const router = useRouter();
  const active = lendings.filter((l) => l.status !== 'paid');
  const totalOutstanding = active.reduce(
    (sum, l) => sum + getLendingRemaining(l),
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
            /*
              Two balances, aligned name-left / value-right so the figures form a
              column (§2's alignment, §3's tabular numerals). Both digits carry a
              semantic colour, so the glyph follows them via `surface="inherit"`
              rather than staying a grey ₱.
            */
            <Stack spacing={0.75}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                spacing={1.5}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Outstanding
                </Typography>
                <Money
                  surface="inherit"
                  amount={Math.round(totalOutstanding)}
                  sx={{
                    flexShrink: 0,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'warning.main',
                  }}
                />
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                spacing={1.5}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Received back
                </Typography>
                <Money
                  surface="inherit"
                  amount={Math.round(totalReceived)}
                  sx={{
                    flexShrink: 0,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'success.main',
                  }}
                />
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
