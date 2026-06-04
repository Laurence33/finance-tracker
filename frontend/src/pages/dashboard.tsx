import { use, useMemo, useState } from 'react';
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
import DashboardTimeRangeSelector from '@/components/molecules/DashboardTimeRangeSelector';
import RecentActivityFeed from '@/components/molecules/RecentActivityFeed';
import SpendOverTimeChart from '@/components/molecules/SpendOverTimeChart';
import DashboardRunwayWidget from '@/components/molecules/DashboardRunwayWidget';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardRange } from '@/utils/dashboard-helpers';

const sumAmount = (items: { amount: number }[]) =>
  items.reduce((sum, i) => sum + Number(i.amount), 0);

function formatDelta(current: number, previous: number): {
  text: string;
  positive: boolean;
} | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (!isFinite(pct)) return null;
  const sign = pct >= 0 ? '+' : '';
  return { text: `${sign}${pct.toFixed(0)}%`, positive: pct >= 0 };
}

export default function DashboardPage() {
  const theme = useTheme();
  const { fundSources, recurringExpenses, lendings } = use(AppContext);

  const [range, setRange] = useState<DashboardRange>('1M');
  const {
    loading,
    currentExpenses,
    currentIncomes,
    previousExpenses,
    previousIncomes,
    currentMonths,
  } = useDashboardData(range);

  const totalBalance = useMemo(
    () => fundSources.reduce((sum, fs) => sum + Number(fs.balance), 0),
    [fundSources],
  );

  const currentTotalExpenses = useMemo(
    () => sumAmount(currentExpenses),
    [currentExpenses],
  );
  const currentTotalIncome = useMemo(
    () => sumAmount(currentIncomes),
    [currentIncomes],
  );
  const previousTotalExpenses = useMemo(
    () => sumAmount(previousExpenses),
    [previousExpenses],
  );
  const previousTotalIncome = useMemo(
    () => sumAmount(previousIncomes),
    [previousIncomes],
  );
  const net = currentTotalIncome - currentTotalExpenses;
  const previousNet = previousTotalIncome - previousTotalExpenses;

  const netDelta = formatDelta(net, previousNet);
  const incomeDelta = formatDelta(currentTotalIncome, previousTotalIncome);
  // For expenses, "good" is going down — flip the positive sign
  const expenseDeltaRaw = formatDelta(
    currentTotalExpenses,
    previousTotalExpenses,
  );
  const expenseDelta = expenseDeltaRaw
    ? { text: expenseDeltaRaw.text, positive: !expenseDeltaRaw.positive }
    : null;

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

      <DashboardTimeRangeSelector range={range} onChange={setRange} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <SummaryStat
          title="Net"
          value={`${net >= 0 ? '+' : ''}₱${net.toLocaleString()}`}
          color={
            net >= 0 ? theme.palette.success.main : theme.palette.error.main
          }
          icon={net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          delta={netDelta}
          loading={loading}
        />
        <SummaryStat
          title="Income"
          value={`₱${currentTotalIncome.toLocaleString()}`}
          color={theme.palette.success.main}
          icon={<TrendingUpIcon />}
          delta={incomeDelta}
          loading={loading}
        />
        <SummaryStat
          title="Expenses"
          value={`₱${currentTotalExpenses.toLocaleString()}`}
          color={theme.palette.error.main}
          icon={<TrendingDownIcon />}
          delta={expenseDelta}
          loading={loading}
        />
      </Box>

      <Stack spacing={2}>
        <FundBalancesChart fundSources={fundSources} />
        <DashboardRunwayWidget
          totalBalance={totalBalance}
          totalExpenses={currentTotalExpenses}
          monthCount={currentMonths.length}
        />
        <SpendOverTimeChart
          expenses={currentExpenses}
          incomes={currentIncomes}
          range={range}
        />
        <ExpensesByTagChart expenses={currentExpenses} />
        <RecentActivityFeed
          expenses={currentExpenses}
          incomes={currentIncomes}
        />
        <DashboardForecastWidget
          fundSources={fundSources}
          recurringExpenses={recurringExpenses}
          lendings={lendings}
          totalIncome={currentTotalIncome}
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
  delta,
  loading,
}: {
  title: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  delta: { text: string; positive: boolean } | null;
  loading: boolean;
}) {
  const theme = useTheme();
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
          opacity: loading ? 0.5 : 1,
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
        {delta && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: delta.positive
                ? theme.palette.success.main
                : theme.palette.error.main,
              lineHeight: 1,
            }}
          >
            {delta.text}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
