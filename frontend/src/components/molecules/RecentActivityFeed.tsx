import { useMemo } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Money from '@/components/atoms/Money';
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
          /*
            A widget mini-list (§2's alignment and tabular figures, no group
            header or count). Expenses are the majority direction here, so per §4
            they take no sign and no colour; income takes the leading `+` and
            `success.main`. That is the same convention the transactions ledger
            uses, and it is why the per-row direction arrow is gone — a red
            down-arrow on every expense row was a badge on the majority state
            paying ~48px of the name's width for a fact the sign already carries.
          */
          <Stack spacing={1.25}>
            {entries.map((entry) => {
              const isIncome = entry.kind === 'income';
              return (
                <Stack
                  key={`${entry.kind}-${entry.timestamp}`}
                  direction="row"
                  alignItems="flex-start"
                  spacing={1.5}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        lineHeight: 1.3,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.fundSource} · {formatTimestamp(entry.timestamp)}
                    </Typography>
                  </Box>
                  <Money
                    surface={isIncome ? 'inherit' : 'default'}
                    amount={Math.round(entry.amount)}
                    sign={isIncome ? '+' : undefined}
                    sx={{
                      flexShrink: 0,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      lineHeight: 1.3,
                      ...(isIncome ? { color: 'success.main' } : null),
                    }}
                  />
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
