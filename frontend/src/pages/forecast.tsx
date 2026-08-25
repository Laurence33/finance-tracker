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
import { generateForecast, computeAverageIncome } from '@/utils/forecast-helpers';
import { formatMoney } from '@/utils/money';
import { ForecastHorizon } from '@/types/Forecast';
import CashFlowForecastChart from '@/components/molecules/CashFlowForecastChart';
import ForecastBreakdown from '@/components/molecules/ForecastBreakdown';

export default function ForecastPage() {
  const {
    fundSources,
    recurringExpenses,
    lendings,
    totalIncome,
  } = use(AppContext);

  const [horizon, setHorizon] = useState<ForecastHorizon>(30);
  const [incomeOverride, setIncomeOverride] = useState<string>('');
  const [averageIncome, setAverageIncome] = useState<number>(0);
  const [incomeMonthsUsed, setIncomeMonthsUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // The prior two months of income, keyed the same way AppContext and the
  // dashboard key them, so all three share one fetch per month.
  const priorMonths = useMemo(() => {
    const now = TZDate.tz('asia/singapore');
    return [1, 2].map((back) => format(subMonths(now, back), 'yyyy-MM'));
  }, []);

  // Two hooks because the count must be fixed, but the results collapse into one
  // shape per month so the rest of the page reads a list rather than four
  // positionally-named values. A month that failed contributes nothing rather
  // than poisoning the average — computeAverageIncome reports how many it used.
  const priorResults = [
    useSWR(KEYS.incomes(priorMonths[0]), swrFetcher),
    useSWR(KEYS.incomes(priorMonths[1]), swrFetcher),
  ].map((result) => ({
    settled: Boolean(result.data || result.error),
    total: result.error ? null : (result.data?.data?.totalIncome ?? 0),
  }));

  const priorSettled = priorResults.every((month) => month.settled);
  const usableTotals = priorResults.flatMap((month) =>
    month.total === null ? [] : [month.total],
  );
  // A primitive dep, so the effect doesn't re-run on every render just because
  // the array above is rebuilt.
  const usableTotalsKey = usableTotals.join(',');

  useEffect(() => {
    if (!priorSettled) return;

    const { average, monthsUsed } = computeAverageIncome([totalIncome, ...usableTotals]);
    setAverageIncome(average);
    setIncomeMonthsUsed(monthsUsed);
    setIncomeOverride(Math.round(average).toString());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorSettled, totalIncome, usableTotalsKey]);

  const effectiveIncome = incomeOverride !== ''
    ? Number(incomeOverride) || 0
    : averageIncome;

  const forecastData = useMemo(
    () =>
      generateForecast({
        fundSources,
        recurringExpenses,
        lendings,
        averageMonthlyIncome: effectiveIncome,
        horizonDays: horizon,
      }),
    [fundSources, recurringExpenses, lendings, effectiveIncome, horizon],
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
        <Stack direction="row" spacing={2} alignItems="center">
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

          <TextField
            size="small"
            label="Monthly Income"
            type="number"
            value={incomeOverride}
            onChange={(e) => setIncomeOverride(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
              htmlInput: { step: 'any' },
            }}
            sx={{ width: 180 }}
          />
        </Stack>

        {!loading && averageIncome > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {incomeMonthsUsed === 1
              ? `Based on 1 month of recorded income, ${formatMoney(Math.round(averageIncome))}`
              : `Based on a ${incomeMonthsUsed}-month average income of ${formatMoney(Math.round(averageIncome))}`}
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
