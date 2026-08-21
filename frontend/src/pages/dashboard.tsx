import { use, useMemo, useState } from 'react';
import {
  Alert,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AppContext } from '@/context/AppContext';
import Money from '@/components/atoms/Money';
import SummaryHeroCard, {
  SummaryHeroStat,
} from '@/components/molecules/SummaryHeroCard';
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
import { isLendingOverdue } from '@/utils/lending-helpers';

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
    error,
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

  // Two stats, not three. `Sources` is the denominator of the headline figure,
  // which is what makes the total honest without a caption; `Overdue` is a §5
  // conditional stat. A third — active recurring, say — would restate a count
  // the widget below already carries as its own headline (§8.8).
  const stats: SummaryHeroStat[] = useMemo(() => {
    const overdueCount = lendings.filter(isLendingOverdue).length;
    return [
      { value: fundSources.length, label: 'Sources' },
      ...(overdueCount > 0
        ? [
            {
              value: overdueCount,
              label: 'Overdue',
              icon: <WarningAmberIcon />,
            },
          ]
        : []),
    ];
  }, [fundSources, lendings]);

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
    <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
      <SummaryHeroCard
        hue="primary"
        icon={<AccountBalanceWalletIcon />}
        eyebrow="Dashboard"
        label="Total balance"
        // Rounded here, not in the hero — §3 leaves rounding to the caller.
        amount={Math.round(totalBalance)}
        // No caption: this is the exact sum of the fund sources charted below,
        // not a derived aggregate, and §3's honesty caption is for the latter.
        stats={stats}
      />

      <DashboardTimeRangeSelector range={range} onChange={setRange} />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

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
          // §3: a negative takes a sign, never a negative number behind the
          // glyph, and the caller rounds.
          amount={Math.abs(Math.round(net))}
          sign={net < 0 ? '-' : '+'}
          color={
            net >= 0 ? theme.palette.success.main : theme.palette.error.main
          }
          icon={net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          delta={netDelta}
          loading={loading}
        />
        <SummaryStat
          title="Income"
          amount={Math.round(currentTotalIncome)}
          color={theme.palette.success.main}
          icon={<TrendingUpIcon />}
          delta={incomeDelta}
          loading={loading}
        />
        <SummaryStat
          title="Expenses"
          amount={Math.round(currentTotalExpenses)}
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

/**
 * One tile of the flow stat grid that sits below the hero — §5 sends a screen's
 * fourth-and-beyond figure here rather than into the hero's stat rail. Three
 * money figures would not fit inside the hero at 390px, and these carry a
 * period-over-period delta the hero's stat shape has no room for.
 */
function SummaryStat({
  title,
  amount,
  sign,
  color,
  icon,
  delta,
  loading,
}: {
  title: string;
  amount: number;
  sign?: '+' | '-';
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
        <Money
          amount={amount}
          sign={sign}
          sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}
        />
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
