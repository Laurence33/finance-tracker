import { useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import Money from '@/components/atoms/Money';
import { FundSource } from '@/types/FundSource';
import { RecurringExpense } from '@/types/RecurringExpense';
import { Lending } from '@/types/Lending';
import { generateForecast } from '@/utils/forecast-helpers';

/**
 * One projection row of the widget's mini-list: label left, figure right, so the
 * three horizons read as a column (§2's alignment, §3's tabular numerals). Not a
 * ledger group — no header, no count, and the widget keeps its own density.
 *
 * A projected balance can go negative, and §3 forbids `₱-7,350`: the sign goes
 * ahead of the glyph and the magnitude stays positive. The digits are
 * semantically coloured, so the glyph follows them (`surface="inherit"`).
 */
function ForecastRow({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value);
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="baseline"
      spacing={1.5}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Money
        surface="inherit"
        amount={Math.abs(rounded)}
        sign={rounded < 0 ? '-' : undefined}
        sx={{
          flexShrink: 0,
          fontSize: '0.875rem',
          fontWeight: 600,
          color: rounded >= 0 ? 'success.main' : 'error.main',
        }}
      />
    </Stack>
  );
}

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

  return (
    <Card>
      <CardActionArea onClick={() => router.push('/forecast')}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Cash Flow Forecast
          </Typography>
          <Stack spacing={0.75}>
            <ForecastRow label="In 30 days" value={projections.at30} />
            <ForecastRow label="In 60 days" value={projections.at60} />
            <ForecastRow label="In 90 days" value={projections.at90} />
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
