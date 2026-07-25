import React, { useEffect, use, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  IconButton,
  InputAdornment,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { AppContext } from '@/context/AppContext';
import ExpenseDialog from '@/components/organisms/ExpenseDialog';
import IncomeDialog from '@/components/organisms/IncomeDialog';
import MonthSelector from '@/components/molecules/MonthSelector';
import TransactionsList from '@/components/molecules/TransactionsList';
import Money from '@/components/atoms/Money';

type TransactionFilter = 'all' | 'expenses' | 'income';

/**
 * The figure typography, shared by the money and the count stats so they stay
 * one column of numerals (§3). Money supplies its own tabular-nums.
 */
const FIGURE_SX = {
  fontWeight: 700,
  lineHeight: 1.3,
  fontSize: { xs: '1rem', sm: '1.1rem' },
} as const;

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  /** The figure itself — a `Money`, or a `Typography` for a plain count. */
  value: React.ReactNode;
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
          {value}
        </Box>
      </CardContent>
    </Card>
  );
}

/** A non-money stat, kept on the same numerals as the money ones (§3). */
function CountFigure({ value }: { value: number }) {
  return (
    <Typography sx={{ ...FIGURE_SX, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
  );
}

/** A money stat. `Money` rounds nothing, so the caller does (§3). */
function MoneyFigure({ amount, sign }: { amount: number; sign?: '+' | '-' }) {
  return <Money amount={Math.round(amount)} sign={sign} sx={FIGURE_SX} />;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) setSearchQuery('');
      return next;
    });
  };

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
            value={<MoneyFigure amount={totalExpenses} />}
            icon={<AccountBalanceWalletIcon />}
            color={theme.palette.primary.main}
          />
          <SummaryCard
            title="Transactions"
            value={<CountFigure value={expenses.length} />}
            icon={<ReceiptLongIcon />}
            color={theme.palette.secondary.main}
          />
          <SummaryCard
            title="Average"
            value={<MoneyFigure amount={averageExpense} />}
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
            value={<MoneyFigure amount={totalIncome} />}
            icon={<SavingsIcon />}
            color={theme.palette.success.main}
          />
          <SummaryCard
            title="Transactions"
            value={<CountFigure value={incomes.length} />}
            icon={<ReceiptLongIcon />}
            color={theme.palette.secondary.main}
          />
          <SummaryCard
            title="Average"
            value={<MoneyFigure amount={averageIncome} />}
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
          // §3: a negative amount takes a sign, not a negative number, or the
          // glyph ends up ahead of the minus (`₱-7,350`).
          value={
            <MoneyFigure
              amount={Math.abs(net)}
              sign={net === 0 ? undefined : net > 0 ? '+' : '-'}
            />
          }
          icon={net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          color={net >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
        <SummaryCard
          title="Income"
          value={<MoneyFigure amount={totalIncome} />}
          icon={<SavingsIcon />}
          color={theme.palette.success.main}
        />
        <SummaryCard
          title="Expenses"
          value={<MoneyFigure amount={totalExpenses} />}
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

      {/*
        `pb: 12` is SpeedDial clearance (§6). Only the dial's own 56px Fab is a
        persistent obstruction: it sits at `bottom: 88`, so it covers 88–144px up
        from the viewport bottom, and Layout's 80px plus this 96px clears it with
        32px to spare. The dial's box is far taller — 184px, because its actions
        container adds 160px less a -32px margin — but while closed MUI gives that
        container `pointer-events: none` and its buttons `opacity: 0`, so it
        neither shows nor swallows taps. Open, the actions reach ~272px up over
        the last rows with no backdrop; that is a transient menu and is not
        padded for, exactly as a Select's popover isn't.
      */}
      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.secondary' }}
            >
              {filter === 'all'
                ? 'Recent Transactions'
                : filter === 'expenses'
                  ? 'Recent Expenses'
                  : 'Recent Income'}
            </Typography>
            <IconButton
              onClick={toggleSearch}
              color={searchOpen ? 'primary' : 'default'}
              aria-label={searchOpen ? 'Close search' : 'Search transactions'}
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </IconButton>
          </Stack>

          <Collapse in={searchOpen} timeout="auto" unmountOnExit>
            <TextField
              fullWidth
              size="small"
              autoFocus
              placeholder="Search notes, tags, source…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mt: 1.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </Collapse>
        </Box>

        <TransactionsList
          expenses={expenses}
          incomes={incomes}
          filter={filter}
          searchQuery={searchQuery}
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
