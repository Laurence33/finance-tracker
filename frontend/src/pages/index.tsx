import React, { useEffect, use, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Fab,

  Typography,
  useTheme,
  AppBar,
  Toolbar,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';
import ExpenseDialog from '@/components/organisms/ExpenseDialog';
import MonthSelector from '@/components/molecules/MonthSelector';

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

export default function Home() {
  const theme = useTheme();
  const {
    expenses,
    fetchExpenses,
    setExpenseFormOpen,
    setFormAction,
    totalExpenses,
  } = use(AppContext);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpenseClickHandler = () => {
    setExpenseFormOpen(true);
    setFormAction('create');
  };

  const averageExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalExpenses / expenses.length);
  }, [totalExpenses, expenses.length]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <ExpenseDialog />

      {/* App Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <AccountBalanceWalletIcon
            sx={{ color: 'primary.main', mr: 1.5, fontSize: 28 }}
          />
          <Typography
            variant="h6"
            sx={{ color: 'text.primary', fontWeight: 700 }}
          >
            Finance Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
        {/* Month Selector */}
        <MonthSelector />

        {/* Summary Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1.5,
            mb: 3,
          }}
        >
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
        </Box>

        {/* Expenses Section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
          >
            Recent Expenses
          </Typography>
        </Box>

        <ExpenseList expenses={expenses} />
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add expense"
        onClick={addExpenseClickHandler}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
