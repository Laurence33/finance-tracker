import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import React, { useState, useEffect } from 'react';
import { HttpClient } from '../utils/httpClient';
import CreateExpenseForm from '@/components/molecules/CreateExpenseForm';
import { Expense } from '@/types/Expense';
import ExpenseList from '@/components/molecules/ExpensesList';

interface SnackBarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

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
      setSnackBarState((prevState) => ({
        ...prevState,
        open: true,
        message: error.message,
        severity: 'error',
      }));
    }
  }

  function showSuccessSnackBar(message: string) {
    setSnackBarState((prevState) => ({
      ...prevState,
      open: true,
      message: message,
      severity: 'success',
    }));
  }

  function showErrorSnackBar(message: string) {
    setSnackBarState((prevState) => ({
      ...prevState,
      open: true,
      message: message,
      severity: 'error',
    }));
  }

  const handleSnackBarClose = () => {
    setSnackBarState({ ...snackBarState, open: false });
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={snackBarState.open}
        onClose={handleSnackBarClose}
        // message={snackBarState.message}
        autoHideDuration={5000}
      >
        <Alert
          onClose={handleSnackBarClose}
          severity={snackBarState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackBarState.message}
        </Alert>
      </Snackbar>

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
