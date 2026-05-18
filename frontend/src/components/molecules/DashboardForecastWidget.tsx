import { useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { FundSource } from '@/types/FundSource';
import { RecurringExpense } from '@/types/RecurringExpense';
import { Lending } from '@/types/Lending';
import { generateForecast } from '@/utils/forecast-helpers';

export default function DashboardForecastWidget({
  fundSources,
  recurringExpenses,
  lendings,
  totalIncome,
}: {
  fundSources: FundSource[];
  recurringExpenses: RecurringExpense[];
  lendings: Lending[];
  totalIncome: number;
}) {
  const router = useRouter();

  const projections = useMemo(() => {
    const data = generateForecast({
      fundSources,
      recurringExpenses,
      lendings,
      averageMonthlyIncome: totalIncome,
      horizonDays: 90,
    });

    // Data points are at weekly intervals. Index ~4 = 28 days, 8 = 56, 12 = 84
    // Use closest week to 30/60/90
    const at30 = data[Math.min(4, data.length - 1)]?.expected ?? 0;
    const at60 = data[Math.min(8, data.length - 1)]?.expected ?? 0;
    const at90 = data[Math.min(12, data.length - 1)]?.expected ?? 0;

    return { at30, at60, at90 };
  }, [fundSources, recurringExpenses, lendings, totalIncome]);

  const colorFor = (value: number) =>
    value >= 0 ? 'success.main' : 'error.main';

  return (
    <Card>
      <CardActionArea onClick={() => router.push('/forecast')}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Cash Flow Forecast
          </Typography>
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                In 30 days
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colorFor(projections.at30) }}
              >
                ₱{Math.round(projections.at30).toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                In 60 days
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colorFor(projections.at60) }}
              >
                ₱{Math.round(projections.at60).toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                In 90 days
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colorFor(projections.at90) }}
              >
                ₱{Math.round(projections.at90).toLocaleString()}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', mt: 0.5 }}
            >
              Based on this month&apos;s income
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
