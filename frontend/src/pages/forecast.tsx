import { use, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  InputAdornment,
} from '@mui/material';
import { format, subMonths } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import useSWR from 'swr';
import { AppContext } from '@/context/AppContext';
import { swrFetcher } from '@/utils/httpClient';
import { KEYS } from '@/utils/swr-keys';
import {
  generateForecast,
  computeAverageIncome,
  computeAverageSpending,
  recurringPaidInMonth,
  AverageIncome,
} from '@/utils/forecast-helpers';
import { formatMoney } from '@/utils/money';
import { ForecastHorizon } from '@/types/Forecast';
import CashFlowForecastChart from '@/components/molecules/CashFlowForecastChart';
import ForecastBreakdown from '@/components/molecules/ForecastBreakdown';

/**
 * One month's total from `/incomes?month=` or `/expenses?month=`. A month that
 * failed reports `null` and contributes nothing rather than poisoning the
 * average — the compute helpers report how many months they actually used.
 */
function useMonthTotal(key: string, field: 'totalIncome' | 'totalExpenses') {
  const { data, error } = useSWR(key, swrFetcher);
  return {
    settled: Boolean(data || error),
    total: error ? null : ((data?.data?.[field] as number | undefined) ?? 0),
  };
}

const NO_AVERAGE: AverageIncome = { average: 0, monthsUsed: 0 };

export default function ForecastPage() {
  const { fundSources, recurringExpenses, lendings } = use(AppContext);

  const [horizon, setHorizon] = useState<ForecastHorizon>(30);
  const [incomeOverride, setIncomeOverride] = useState<string>('');
  const [spendingOverride, setSpendingOverride] = useState<string>('');
  const [averageIncome, setAverageIncome] = useState<AverageIncome>(NO_AVERAGE);
  const [averageSpending, setAverageSpending] = useState<AverageIncome>(NO_AVERAGE);
  const [loading, setLoading] = useState(true);

  // This month and the two before it, anchored on today rather than on the
  // app's selected month, and keyed the same way AppContext and the dashboard
  // key them so every page shares one fetch per month.
  const months = useMemo(() => {
    const now = TZDate.tz('asia/singapore');
    return [0, 1, 2].map((back) => format(subMonths(now, back), 'yyyy-MM'));
  }, []);

  // Fixed hook count, so one call per month rather than a loop.
  const incomeMonths = [
    useMonthTotal(KEYS.incomes(months[0]), 'totalIncome'),
    useMonthTotal(KEYS.incomes(months[1]), 'totalIncome'),
    useMonthTotal(KEYS.incomes(months[2]), 'totalIncome'),
  ];
  const expenseMonths = [
    useMonthTotal(KEYS.expenses(months[0]), 'totalExpenses'),
    useMonthTotal(KEYS.expenses(months[1]), 'totalExpenses'),
    useMonthTotal(KEYS.expenses(months[2]), 'totalExpenses'),
  ];
  // Only the window being averaged — the oldest of the three months onward.
  const paymentsRes = useSWR(KEYS.recurringPaymentsSince(months[2]), swrFetcher);
  // Same key AppContext holds, so no extra request — only here to know when
  // the recurring list has actually arrived, which the netting depends on.
  const recurringRes = useSWR(KEYS.recurringExpenses, swrFetcher);

  const settled =
    [...incomeMonths, ...expenseMonths].every((month) => month.settled) &&
    Boolean(paymentsRes.data || paymentsRes.error) &&
    Boolean(recurringRes.data || recurringRes.error);

  const usableIncomes = incomeMonths.flatMap((month) =>
    month.total === null ? [] : [month.total],
  );
  const usableExpenses = expenseMonths.flatMap((month, i) =>
    month.total === null ? [] : [{ month: months[i], totalExpenses: month.total }],
  );
  // Primitive deps, so the effect doesn't re-run on every render just because
  // the arrays above are rebuilt.
  const usableIncomesKey = usableIncomes.join(',');
  const usableExpensesKey = usableExpenses.map((m) => `${m.month}:${m.totalExpenses}`).join(',');
  const payments = paymentsRes.data?.data?.payments;

  useEffect(() => {
    if (!settled) return;

    const income = computeAverageIncome(usableIncomes);
    setAverageIncome(income);
    setIncomeOverride(Math.round(income.average).toString());

    // Without the payments there is no way to net recurring out of the totals,
    // and an un-netted average would double count — so offer no estimate
    // rather than a wrong one: the field is left visibly blank, not "0".
    if (payments) {
      const spending = computeAverageSpending(
        usableExpenses.map(({ month, totalExpenses }) => ({
          totalExpenses,
          recurringPaid: recurringPaidInMonth(payments, recurringExpenses, month),
        })),
      );
      setAverageSpending(spending);
      setSpendingOverride(Math.round(spending.average).toString());
    } else {
      setAverageSpending(NO_AVERAGE);
      setSpendingOverride('');
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, usableIncomesKey, usableExpensesKey, payments, recurringExpenses]);

  const effectiveIncome = incomeOverride !== ''
    ? Number(incomeOverride) || 0
    : averageIncome.average;
  const effectiveSpending = spendingOverride !== ''
    ? Number(spendingOverride) || 0
    : averageSpending.average;

  const forecastData = useMemo(
    () =>
      generateForecast({
        fundSources,
        recurringExpenses,
        lendings,
        averageMonthlyIncome: effectiveIncome,
        averageMonthlySpending: effectiveSpending,
        horizonDays: horizon,
      }),
    [fundSources, recurringExpenses, lendings, effectiveIncome, effectiveSpending, horizon],
  );

  const allEvents = useMemo(
    () => forecastData.flatMap((dp) => dp.events),
    [forecastData],
  );

  const asNeededCount = recurringExpenses.filter(
    (re) => re.status === 'active' && re.frequency === 'as_needed',
  ).length;

  return (
    <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Cash Flow Forecast
      </Typography>

      {/* Controls */}
      <Stack spacing={2} sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={horizon}
          exclusive
          onChange={(_, val) => val !== null && setHorizon(val)}
          size="small"
        >
          <ToggleButton value={30}>30d</ToggleButton>
          <ToggleButton value={60}>60d</ToggleButton>
          <ToggleButton value={90}>90d</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={2} alignItems="center">
          <MoneyField
            label="Monthly Income"
            value={incomeOverride}
            onChange={setIncomeOverride}
          />
          <MoneyField
            label="Monthly Spending"
            value={spendingOverride}
            onChange={setSpendingOverride}
          />
        </Stack>

        {!loading && averageIncome.monthsUsed > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {describeAverage('income', averageIncome)}
          </Typography>
        )}

        {/*
          §3: the spending figure is derived — recurring bills are netted out
          because they are projected as dated events below — so the caption
          says what it excludes rather than letting it read as total spending.
        */}
        {!loading && averageSpending.monthsUsed > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {describeAverage('spending', averageSpending)} · excludes recurring
          </Typography>
        )}

        {!loading && paymentsRes.error && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Couldn&apos;t load recurring payments — spending not estimated
          </Typography>
        )}

        {asNeededCount > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {asNeededCount} &quot;as-needed&quot; expense{asNeededCount > 1 ? 's' : ''} not included in projections
          </Typography>
        )}
      </Stack>

      {/* Chart & Breakdown */}
      <Stack spacing={2}>
        <CashFlowForecastChart data={forecastData} />
        <ForecastBreakdown events={allEvents} />
      </Stack>
    </Container>
  );
}

function describeAverage(what: 'income' | 'spending', { average, monthsUsed }: AverageIncome) {
  const amount = formatMoney(Math.round(average));
  return monthsUsed === 1
    ? `Based on 1 month of recorded ${what}, ${amount}`
    : `Based on a ${monthsUsed}-month average ${what} of ${amount}`;
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      size="small"
      label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">₱</InputAdornment>,
        },
        htmlInput: { step: 'any' },
      }}
      sx={{ flex: 1, minWidth: 0 }}
    />
  );
}
