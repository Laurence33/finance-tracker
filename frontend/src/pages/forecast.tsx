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
import { AppContext } from '@/context/AppContext';
import { HttpClient } from '@/utils/httpClient';
import { generateForecast, computeAverageIncome } from '@/utils/forecast-helpers';
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
  const [loading, setLoading] = useState(true);

  // Fetch prior 2 months of income to compute average
  useEffect(() => {
    async function fetchHistoricalIncome() {
      try {
        const now = TZDate.tz('asia/singapore');
        const month1 = format(subMonths(now, 1), 'yyyy-MM');
        const month2 = format(subMonths(now, 2), 'yyyy-MM');

        const [res1, res2] = await Promise.all([
          HttpClient.get<any>(`/incomes?month=${month1}`),
          HttpClient.get<any>(`/incomes?month=${month2}`),
        ]);

        const totals = [
          totalIncome,
          res1?.data?.totalIncome || 0,
          res2?.data?.totalIncome || 0,
        ];

        const avg = computeAverageIncome(totals);
        setAverageIncome(avg);
        setIncomeOverride(Math.round(avg).toString());
      } catch {
        // Fall back to current month's income
        setAverageIncome(totalIncome);
        setIncomeOverride(Math.round(totalIncome).toString());
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalIncome();
  }, [totalIncome]);

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
    <Container maxWidth="sm" sx={{ py: 3 }}>
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
            }}
            sx={{ width: 180 }}
          />
        </Stack>

        {!loading && averageIncome > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Based on 3-month average income of ₱{Math.round(averageIncome).toLocaleString()}
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
