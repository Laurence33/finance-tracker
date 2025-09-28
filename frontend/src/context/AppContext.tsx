import { Expense } from '@/types/Expense';
import { SnackBarState } from '@/types/SnackBarState';
import { HttpClient } from '@/utils/httpClient';
import { Alert, Snackbar } from '@mui/material';
import { createContext, useState } from 'react';

interface AppContextType {
  expenses: Expense[];
  fetchExpenses: () => Promise<void>;
  snackBarState: SnackBarState;
  showSuccessSnackBar: (message: string) => void;
  showErrorSnackBar: (message: string) => void;
  handleSnackBarClose: () => void;
}

export const AppContext = createContext<AppContextType>({
  expenses: [],
  fetchExpenses: async () => {},
  snackBarState: {
    open: false,
    message: '',
    severity: 'success',
  },
  showSuccessSnackBar: () => {},
  showErrorSnackBar: () => {},
  handleSnackBarClose: () => {},
});

export default function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const contextValue = {
    expenses,
    fetchExpenses,
    snackBarState,
    showSuccessSnackBar,
    showErrorSnackBar,
    handleSnackBarClose,
  };

  return (
    <AppContext value={contextValue}>
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
      {children}
    </AppContext>
  );
}
