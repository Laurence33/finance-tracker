import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';

export default function DashboardRunwayWidget({
  totalBalance,
  totalExpenses,
  monthCount,
}: {
  totalBalance: number;
  totalExpenses: number;
  monthCount: number;
}) {
  const theme = useTheme();
  const avgMonthlySpend =
    monthCount > 0 && totalExpenses > 0 ? totalExpenses / monthCount : 0;
  const months = avgMonthlySpend > 0 ? totalBalance / avgMonthlySpend : null;

  const color =
    months === null
      ? theme.palette.text.secondary
      : months >= 6
        ? theme.palette.success.main
        : months >= 3
          ? theme.palette.warning.main
          : theme.palette.error.main;

  const display =
    months === null
      ? '—'
      : months >= 24
        ? '24+ months'
        : `~${months.toFixed(1)} months`;

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.1),
              color,
              flexShrink: 0,
            }}
          >
            <HourglassBottomIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Runway
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {avgMonthlySpend > 0
                ? `At ₱${Math.round(avgMonthlySpend).toLocaleString()}/mo avg spend`
                : 'No spend data in this period'}
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color, flexShrink: 0 }}
          >
            {display}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
