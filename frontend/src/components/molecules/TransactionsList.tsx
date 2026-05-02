import { Box, Stack, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';
import ExpenseItem from '@/components/atoms/ExpenseItem';
import IncomeItem from '@/components/atoms/IncomeItem';

type TransactionFilter = 'all' | 'expenses' | 'income';

type Transaction =
  | { type: 'expense'; data: Expense; sortKey: string }
  | { type: 'income'; data: Income; sortKey: string };

export default function TransactionsList({
  expenses,
  incomes,
  filter,
}: {
  expenses: Expense[];
  incomes: Income[];
  filter: TransactionFilter;
}) {
  const transactions: Transaction[] = [];

  if (filter === 'all' || filter === 'expenses') {
    for (const expense of expenses) {
      transactions.push({
        type: 'expense',
        data: expense,
        sortKey: expense.timestamp,
      });
    }
  }

  if (filter === 'all' || filter === 'income') {
    for (const income of incomes) {
      transactions.push({
        type: 'income',
        data: income,
        sortKey: income.timestamp,
      });
    }
  }

  // Sort by timestamp descending (newest first)
  transactions.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  if (transactions.length === 0) {
    const emptyLabel =
      filter === 'expenses'
        ? 'No expenses yet'
        : filter === 'income'
          ? 'No income yet'
          : 'No transactions yet';

    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <ReceiptLongIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {emptyLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to add a record
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {transactions.map((tx) =>
        tx.type === 'expense' ? (
          <ExpenseItem key={`exp-${tx.data.timestamp}`} expense={tx.data} />
        ) : (
          <IncomeItem key={`inc-${tx.data.timestamp}`} income={tx.data} />
        ),
      )}
    </Stack>
  );
}
