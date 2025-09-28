import React, { useEffect, use } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';
import ExpenseDialog from '@/components/organisms/ExpenseDialog';

export default function Home() {
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

  return (
    <>
      <ExpenseDialog />
      <Box sx={{ mt: 5, px: 6, maxWidth: '100%' }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Total Expenses: {totalExpenses}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addExpenseClickHandler}
          >
            Add Expense
          </Button>
        </Stack>
        <ExpenseList expenses={expenses} />
      </Box>
    </>
  );
}
