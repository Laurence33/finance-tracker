import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format, startOfWeek } from 'date-fns';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';
import { DashboardRange } from '@/utils/dashboard-helpers';

type Bucket = { label: string; expense: number };

const ChartContent = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        BarChart,
        Bar,
        XAxis,
        YAxis,
        Tooltip,
        ResponsiveContainer,
        CartesianGrid,
      } = recharts;

      return function InnerChart({
        data,
        color,
      }: {
        data: Bucket[];
        color: string;
      }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
              />
              <Tooltip
                formatter={(v) => `₱${Number(v).toLocaleString()}`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
              <Bar dataKey="expense" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false },
);

function parseTs(ts: string): Date {
  // backend stores 'YYYY-MM-DD HH:mm:ss.SSS' (no Z) — treat as local
  return new Date(ts.replace(' ', 'T'));
}

function bucketize(
  expenses: Expense[],
  granularity: 'day' | 'week' | 'month',
): Bucket[] {
  const map = new Map<string, { date: Date; expense: number }>();
  for (const e of expenses) {
    const d = parseTs(e.timestamp);
    let key: string;
    let bucketDate: Date;
    if (granularity === 'day') {
      key = format(d, 'yyyy-MM-dd');
      bucketDate = d;
    } else if (granularity === 'week') {
      const ws = startOfWeek(d, { weekStartsOn: 1 });
      key = format(ws, 'yyyy-MM-dd');
      bucketDate = ws;
    } else {
      key = format(d, 'yyyy-MM');
      bucketDate = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const existing = map.get(key);
    if (existing) {
      existing.expense += Number(e.amount);
    } else {
      map.set(key, { date: bucketDate, expense: Number(e.amount) });
    }
  }

  const labelFmt =
    granularity === 'day'
      ? 'MMM d'
      : granularity === 'week'
        ? 'MMM d'
        : 'MMM';

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, v]) => ({
      label: format(v.date, labelFmt),
      expense: Math.round(v.expense),
    }));
}

function granularityFor(range: DashboardRange): 'day' | 'week' | 'month' {
  if (range === '1M') return 'day';
  if (range === 'YTD') return 'month';
  return 'week';
}

export default function SpendOverTimeChart({
  expenses,
  range,
}: {
  expenses: Expense[];
  incomes: Income[];
  range: DashboardRange;
}) {
  const theme = useTheme();
  const data = useMemo(
    () => bucketize(expenses, granularityFor(range)),
    [expenses, range],
  );

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Spend Over Time
        </Typography>
        {data.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}
          >
            No expenses in this period
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: 200 }}>
            <ChartContent data={data} color={theme.palette.error.main} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
