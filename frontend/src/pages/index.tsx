import Box from '@mui/material/Box';
import React, { useState, useEffect, use } from 'react';
import { HttpClient } from '../utils/httpClient';
import CreateExpenseForm from '@/components/molecules/CreateExpenseForm';
import { Expense } from '@/types/Expense';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';

export default function Home() {
  const { showErrorSnackBar, showSuccessSnackBar, expenses, fetchExpenses } =
    use(AppContext);

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 5 }}
      >
        <CreateExpenseForm
          fetchExpenses={fetchExpenses}
          showErrorSnackBar={showErrorSnackBar}
          showSuccessSnackBar={showSuccessSnackBar}
        />

        <ExpenseList expenses={expenses} />
      </Box>
    </>
  );
}
