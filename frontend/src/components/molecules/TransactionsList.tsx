import { Box, Stack, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';
import ExpenseItem from '@/components/atoms/ExpenseItem';
import IncomeItem from '@/components/atoms/IncomeItem';
import Money from '@/components/atoms/Money';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';
import {
  transactionDateHeading,
  transactionDateKey,
} from '@/utils/transaction-display';

type TransactionFilter = 'all' | 'expenses' | 'income';

type Transaction =
  | { type: 'expense'; data: Expense; sortKey: string }
  | { type: 'income'; data: Income; sortKey: string };

type DayGroup = {
  dateKey: string;
  heading: string;
  items: Transaction[];
};

export default function TransactionsList({
  expenses,
  incomes,
  filter,
  searchQuery = '',
}: {
  expenses: Expense[];
  incomes: Income[];
  filter: TransactionFilter;
  searchQuery?: string;
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

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;
  const matchesQuery = (tx: Transaction) => {
    const fields = [
      tx.data.notes,
      String(tx.data.amount),
      ...(tx.data.tags ?? []),
    ];
    if (tx.type === 'income') fields.push(tx.data.source);
    return fields.some((field) => (field ?? '').toLowerCase().includes(query));
  };
  const visible = isSearching
    ? transactions.filter(matchesQuery)
    : transactions;

  if (visible.length === 0) {
    if (isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ReceiptLongIcon
            sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
          />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
            No matching transactions
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Try a different search term
          </Typography>
        </Box>
      );
    }

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

  // The date was on all 20-odd rows, so it becomes the section header (§2). The
  // rows are already newest-first, so walking them in order gives the groups in
  // that order too and preserves source order inside each day.
  const groups: DayGroup[] = [];
  const groupByDate = new Map<string, DayGroup>();
  for (const tx of visible) {
    const dateKey = transactionDateKey(tx.sortKey);
    let group = groupByDate.get(dateKey);
    if (!group) {
      group = { dateKey, heading: transactionDateHeading(dateKey), items: [] };
      groupByDate.set(dateKey, group);
      groups.push(group);
    }
    group.items.push(tx);
  }

  const net = visible.reduce(
    (sum, tx) => sum + (tx.type === 'income' ? tx.data.amount : -tx.data.amount),
    0,
  );

  return (
    <Stack spacing={2}>
      {groups.map((group, index) => (
        <LedgerGroupCard
          key={group.dateKey}
          label={group.heading}
          count={group.items.length}
          index={index}
        >
          {group.items.map((tx) =>
            tx.type === 'expense' ? (
              <ExpenseItem key={`exp-${tx.data.timestamp}`} expense={tx.data} />
            ) : (
              <IncomeItem key={`inc-${tx.data.timestamp}`} income={tx.data} />
            ),
          )}
        </LedgerGroupCard>
      ))}

      {isSearching && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            mt: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {visible.length} {visible.length === 1 ? 'result' : 'results'} · Net
          </Typography>
          <Money
            variant="subtitle1"
            amount={Math.round(Math.abs(net))}
            sign={net < 0 ? '-' : undefined}
            sx={{
              fontWeight: 700,
              color: net >= 0 ? 'success.main' : 'error.main',
            }}
          />
        </Box>
      )}
    </Stack>
  );
}
