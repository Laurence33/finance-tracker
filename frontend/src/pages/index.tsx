import React, { useEffect, use, useState } from 'react';
import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';
import ExpenseDialog from '@/components/organisms/ExpenseDialog';

export default function Home() {
  const { expenses, fetchExpenses, setExpenseFormOpen, setFormAction } =
    use(AppContext);

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
      <Box sx={{ mt: 5, px: 2, maxWidth: '100%' }}>
        <Stack direction="row" justifyContent="end" sx={{ mb: 2 }}>
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
