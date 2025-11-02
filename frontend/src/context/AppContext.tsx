import { Expense } from '@/types/Expense';
import { FundSource } from '@/types/FundSource';
import { SnackBarState } from '@/types/SnackBarState';
import { Tags } from '@/types/Tags';
import { HttpClient } from '@/utils/httpClient';
import { TZDate } from '@date-fns/tz';
import { Alert, Snackbar } from '@mui/material';
import { format } from 'date-fns';
import { createContext, useEffect, useState } from 'react';

interface AppContextType {
  expenses: Expense[];
  totalExpenses: number;
  setTotalExpenses: (total: number) => void;
  selectedExpense: Expense | null;
  setSelectedExpense: (expense: Expense | null) => void;
  fetchExpenses: () => Promise<void>;
  snackBarState: SnackBarState;
  showSuccessSnackBar: (message: string) => void;
  showErrorSnackBar: (message: string) => void;
  handleSnackBarClose: () => void;
  formAction: 'create' | 'update';
  setFormAction: (action: 'create' | 'update') => void;
  expenseFormOpen: boolean;
  setExpenseFormOpen: (open: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  fundSources: FundSource[];
  setFundSources: (fundSources: FundSource[]) => void;
  tags: Tags[];
  setTags: (tags: Tags[]) => void;
  fetchTags: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  expenses: [],
  totalExpenses: 0,
  setTotalExpenses: () => {},
  selectedExpense: null,
  setSelectedExpense: () => {},
  fetchExpenses: async () => {},
  snackBarState: {
    open: false,
    message: '',
    severity: 'success',
  },
  showSuccessSnackBar: () => {},
  showErrorSnackBar: () => {},
  handleSnackBarClose: () => {},
  formAction: 'create',
  setFormAction: () => {},
  expenseFormOpen: false,
  setExpenseFormOpen: () => {},
  selectedMonth: format(TZDate.tz('asia/singapore'), 'yyyy-MM'),
  setSelectedMonth: () => {},
  fundSources: [],
  setFundSources: () => {},
  tags: [],
  setTags: () => {},
  fetchTags: async () => {},
});

export default function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formAction, setFormAction] = useState<'create' | 'update'>('create');
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(TZDate.tz('asia/singapore'), 'yyyy-MM')
  );
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [tags, setTags] = useState<Tags[]>([]);

  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchFundSources();
    fetchTags();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  async function fetchFundSources() {
    try {
      const response = await HttpClient.get<any>('/fund-sources');
      if (response && response.data) {
        setFundSources(response.data.fundSources || []);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchExpenses() {
    try {
      const response = await HttpClient.get<any>(
        '/expenses?month=' + selectedMonth
      );
      if (response && response.data) {
        setExpenses(response.data.expenses || []);
        setTotalExpenses(response.data.totalExpenses || 0);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchTags() {
    try {
      const response = await HttpClient.get<any>('/tags');
      if (response && response.data) {
        setTags(response.data.tags || []);
      }
    } catch (error: any) {
      console.error('Error fetching tags:', error);
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
    totalExpenses,
    setTotalExpenses,
    selectedExpense,
    setSelectedExpense,
    fundSources,
    setFundSources,
    formAction,
    setFormAction,
    expenseFormOpen,
    setExpenseFormOpen,
    fetchExpenses,
    snackBarState,
    showSuccessSnackBar,
    showErrorSnackBar,
    handleSnackBarClose,
    selectedMonth,
    setSelectedMonth,
    tags,
    setTags,
    fetchTags,
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
