import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';

type Entry = {
  kind: 'expense' | 'income';
  amount: number;
  timestamp: string;
  label: string;
  fundSource: string;
};

const LIMIT = 5;

export default function RecentActivityFeed({
  expenses,
  incomes,
}: {
  expenses: Expense[];
  incomes: Income[];
}) {
  const theme = useTheme();

  const entries: Entry[] = useMemo(() => {
    const combined: Entry[] = [
      ...expenses.map((e) => ({
        kind: 'expense' as const,
        amount: Number(e.amount),
        timestamp: e.timestamp,
        label: e.notes || e.tags?.[0] || 'Expense',
        fundSource: e.fundSource,
      })),
      ...incomes.map((i) => ({
        kind: 'income' as const,
        amount: Number(i.amount),
        timestamp: i.timestamp,
        label: i.source || i.notes || 'Income',
        fundSource: i.fundSource,
      })),
    ];
    return combined
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, LIMIT);
  }, [expenses, incomes]);

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Recent Activity
        </Typography>
        {entries.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}
          >
            No activity in this period
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {entries.map((entry) => {
              const color =
                entry.kind === 'income'
                  ? theme.palette.success.main
                  : theme.palette.error.main;
              return (
                <Stack
                  key={`${entry.kind}-${entry.timestamp}`}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
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
                      flexShrink: 0,
                    }}
                  >
                    {entry.kind === 'income' ? (
                      <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary' }}
                    >
                      {entry.fundSource} · {formatTimestamp(entry.timestamp)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color, flexShrink: 0 }}
                  >
                    {entry.kind === 'income' ? '+' : '-'}₱
                    {entry.amount.toLocaleString()}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(ts: string): string {
  // backend stores 'YYYY-MM-DD HH:mm:ss.SSS' (no Z)
  const datePart = ts.slice(0, 10);
  const timePart = ts.slice(11, 16);
  return `${datePart} ${timePart}`;
}
