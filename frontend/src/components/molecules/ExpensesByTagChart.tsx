import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Expense } from '@/types/Expense';
import { getSpentByTag } from '@/utils/budget-helpers';

type Slice = { name: string; value: number };

const ChartContent = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } =
        recharts;

      return function InnerChart({
        data,
        colors,
      }: {
        data: Slice[];
        colors: string[];
      }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `₱${Number(value).toLocaleString()}`
                }
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false },
);

export default function ExpensesByTagChart({
  expenses,
}: {
  expenses: Expense[];
}) {
  const theme = useTheme();

  const data: Slice[] = useMemo(() => {
    const spent = getSpentByTag(expenses);
    const untagged = expenses
      .filter((e) => !e.tags || e.tags.length === 0)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const slices: Slice[] = Array.from(spent.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (untagged > 0) {
      slices.push({ name: 'Untagged', value: untagged });
    }
    return slices;
  }, [expenses]);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ];

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Expenses by Tag
        </Typography>
        {data.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}
          >
            No expenses to chart
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: 220 }}>
            <ChartContent data={data} colors={colors} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
