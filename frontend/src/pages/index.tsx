import React, { useEffect, use, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import { AppContext } from '@/context/AppContext';
import ExpenseDialog from '@/components/organisms/ExpenseDialog';
import IncomeDialog from '@/components/organisms/IncomeDialog';
import MonthSelector from '@/components/molecules/MonthSelector';
import TransactionsList from '@/components/molecules/TransactionsList';

type TransactionFilter = 'all' | 'expenses' | 'income';

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card sx={{ minWidth: 0 }}>
      <CardContent
        sx={{
          p: 2,
          '&:last-child': { pb: 2 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'center' },
          textAlign: { xs: 'center', sm: 'left' },
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.3,
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ExpensesPage() {
  const theme = useTheme();
  const {
    expenses,
    incomes,
    fetchExpenses,
    setExpenseFormOpen,
    setFormAction,
    totalExpenses,
    totalIncome,
    setIncomeFormOpen,
    setIncomeFormAction,
  } = use(AppContext);

  const [filter, setFilter] = useState<TransactionFilter>('all');

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExpenseClickHandler = () => {
    setExpenseFormOpen(true);
    setFormAction('create');
  };

  const addIncomeClickHandler = () => {
    setIncomeFormOpen(true);
    setIncomeFormAction('create');
  };

  const averageExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalExpenses / expenses.length);
  }, [totalExpenses, expenses.length]);

  const averageIncome = useMemo(() => {
    if (incomes.length === 0) return 0;
    return Math.round(totalIncome / incomes.length);
  }, [totalIncome, incomes.length]);

  const net = totalIncome - totalExpenses;

  const summaryCards = useMemo(() => {
    if (filter === 'expenses') {
      return (
        <>
          <SummaryCard
            title="Total Spent"
            value={`₱${totalExpenses.toLocaleString()}`}
            icon={<AccountBalanceWalletIcon />}
            color={theme.palette.primary.main}
          />
          <SummaryCard
            title="Transactions"
            value={expenses.length.toString()}
            icon={<ReceiptLongIcon />}
            color={theme.palette.secondary.main}
          />
          <SummaryCard
            title="Average"
            value={`₱${averageExpense.toLocaleString()}`}
            icon={<TrendingUpIcon />}
            color={theme.palette.warning.main}
          />
        </>
      );
    }

    if (filter === 'income') {
      return (
        <>
          <SummaryCard
            title="Total Received"
            value={`₱${totalIncome.toLocaleString()}`}
            icon={<SavingsIcon />}
            color={theme.palette.success.main}
          />
          <SummaryCard
            title="Transactions"
            value={incomes.length.toString()}
            icon={<ReceiptLongIcon />}
            color={theme.palette.secondary.main}
          />
          <SummaryCard
            title="Average"
            value={`₱${averageIncome.toLocaleString()}`}
            icon={<TrendingUpIcon />}
            color={theme.palette.warning.main}
          />
        </>
      );
    }

    // 'all' filter
    return (
      <>
        <SummaryCard
          title="Net"
          value={`${net >= 0 ? '+' : ''}₱${net.toLocaleString()}`}
          icon={net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          color={net >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
        <SummaryCard
          title="Income"
          value={`₱${totalIncome.toLocaleString()}`}
          icon={<SavingsIcon />}
          color={theme.palette.success.main}
        />
        <SummaryCard
          title="Expenses"
          value={`₱${totalExpenses.toLocaleString()}`}
          icon={<AccountBalanceWalletIcon />}
          color={theme.palette.error.main}
        />
      </>
    );
  }, [filter, totalExpenses, totalIncome, expenses.length, incomes.length, averageExpense, averageIncome, net, theme]);

  const filterChips: { label: string; value: TransactionFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Expenses', value: 'expenses' },
    { label: 'Income', value: 'income' },
  ];

  return (
    <>
      <ExpenseDialog />
      <IncomeDialog />

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <MonthSelector />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            mb: 2,
          }}
        >
          {summaryCards}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          {filterChips.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              onClick={() => setFilter(chip.value)}
              variant={filter === chip.value ? 'filled' : 'outlined'}
              color={filter === chip.value ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
          >
            {filter === 'all'
              ? 'Recent Transactions'
              : filter === 'expenses'
                ? 'Recent Expenses'
                : 'Recent Income'}
          </Typography>
        </Box>

        <TransactionsList
          expenses={expenses}
          incomes={incomes}
          filter={filter}
        />
      </Container>

      <SpeedDial
        ariaLabel="Add transaction"
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<TrendingDownIcon />}
          slotProps={{ tooltip: { title: 'Add Expense' } }}
          onClick={addExpenseClickHandler}
        />
        <SpeedDialAction
          icon={<SavingsIcon />}
          slotProps={{ tooltip: { title: 'Add Income' } }}
          onClick={addIncomeClickHandler}
        />
      </SpeedDial>
    </>
  );
}
