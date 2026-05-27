import { use, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AppContext } from '@/context/AppContext';
import FundBalancesChart from '@/components/molecules/FundBalancesChart';
import ExpensesByTagChart from '@/components/molecules/ExpensesByTagChart';
import DashboardForecastWidget from '@/components/molecules/DashboardForecastWidget';
import DashboardRecurringStatus from '@/components/molecules/DashboardRecurringStatus';
import DashboardLendingSummary from '@/components/molecules/DashboardLendingSummary';

export default function DashboardPage() {
  const theme = useTheme();
  const {
    fundSources,
    totalIncome,
    totalExpenses,
    expenses,
    recurringExpenses,
    lendings,
  } = use(AppContext);

  const totalBalance = useMemo(
    () => fundSources.reduce((sum, fs) => sum + Number(fs.balance), 0),
    [fundSources],
  );
  const net = totalIncome - totalExpenses;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Card
        sx={{
          mb: 2.5,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha('#ffffff', 0.2),
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ opacity: 0.85, fontWeight: 500 }}
            >
              Total Balance
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₱{totalBalance.toLocaleString()}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <SummaryStat
          title="Net (month)"
          value={`${net >= 0 ? '+' : ''}₱${net.toLocaleString()}`}
          color={
            net >= 0 ? theme.palette.success.main : theme.palette.error.main
          }
          icon={net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
        />
        <SummaryStat
          title="Income"
          value={`₱${totalIncome.toLocaleString()}`}
          color={theme.palette.success.main}
          icon={<TrendingUpIcon />}
        />
        <SummaryStat
          title="Expenses"
          value={`₱${totalExpenses.toLocaleString()}`}
          color={theme.palette.error.main}
          icon={<TrendingDownIcon />}
        />
      </Box>

      <Stack spacing={2}>
        <FundBalancesChart fundSources={fundSources} />
        <ExpensesByTagChart expenses={expenses} />
        <DashboardForecastWidget
          fundSources={fundSources}
          recurringExpenses={recurringExpenses}
          lendings={lendings}
          totalIncome={totalIncome}
        />
        <DashboardRecurringStatus recurringExpenses={recurringExpenses} />
        <DashboardLendingSummary lendings={lendings} />
      </Stack>
    </Container>
  );
}

function SummaryStat({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card sx={{ minWidth: 0 }}>
      <CardContent
        sx={{
          p: 1.5,
          '&:last-child': { pb: 1.5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            color,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, fontSize: '0.9rem' }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
