import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import React, { useState, useEffect, use } from 'react';
import { HttpClient } from '../utils/httpClient';
import CreateExpenseForm from '@/components/molecules/CreateExpenseForm';
import { Expense } from '@/types/Expense';
import ExpenseList from '@/components/molecules/ExpensesList';
import { SnackBarState } from '@/types/SnackBarState';
import { AppContext } from '@/context/AppContext';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const {
    snackBarState,
    showErrorSnackBar,
    showSuccessSnackBar,
    handleSnackBarClose,
  } = use(AppContext);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const response = await HttpClient.get<any>('/expenses');
      if (response && response.data) {
        setExpenses(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showErrorSnackBar(error.message);
    }
  }

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
