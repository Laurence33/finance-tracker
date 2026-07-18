import { Expense } from '@/types/Expense';
import { Asset } from '@/types/Asset';
import { Bucket, FrameworkDefinition, FrameworkMeta } from '@/types/Budget';
import { FundSource } from '@/types/FundSource';
import { Income } from '@/types/Income';
import { Lending } from '@/types/Lending';
import { RecurringExpense } from '@/types/RecurringExpense';
import { SnackBarState } from '@/types/SnackBarState';
import { Tags } from '@/types/Tags';
import { Transfer } from '@/types/Transfer';
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
  fetchFundSources: () => Promise<void>;
  transfers: Transfer[];
  fetchTransfers: () => Promise<void>;
  tags: Tags[];
  setTags: (tags: Tags[]) => void;
  fetchTags: () => Promise<void>;
  incomes: Income[];
  totalIncome: number;
  selectedIncome: Income | null;
  setSelectedIncome: (income: Income | null) => void;
  fetchIncomes: () => Promise<void>;
  incomeFormOpen: boolean;
  setIncomeFormOpen: (open: boolean) => void;
  incomeFormAction: 'create' | 'update';
  setIncomeFormAction: (action: 'create' | 'update') => void;
  lendings: Lending[];
  borrowers: string[];
  fetchLendings: () => Promise<void>;
  recurringExpenses: RecurringExpense[];
  fetchRecurringExpenses: () => Promise<void>;
  assets: Asset[];
  fetchAssets: () => Promise<void>;
  budgetEnabled: boolean;
  budgetFramework: FrameworkMeta | null;
  buckets: Bucket[];
  fetchBudget: () => Promise<void>;
  frameworks: FrameworkDefinition[];
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
  fetchFundSources: async () => {},
  transfers: [],
  fetchTransfers: async () => {},
  tags: [],
  setTags: () => {},
  fetchTags: async () => {},
  incomes: [],
  totalIncome: 0,
  selectedIncome: null,
  setSelectedIncome: () => {},
  fetchIncomes: async () => {},
  incomeFormOpen: false,
  setIncomeFormOpen: () => {},
  incomeFormAction: 'create',
  setIncomeFormAction: () => {},
  lendings: [],
  borrowers: [],
  fetchLendings: async () => {},
  recurringExpenses: [],
  fetchRecurringExpenses: async () => {},
  assets: [],
  fetchAssets: async () => {},
  budgetEnabled: false,
  budgetFramework: null,
  buckets: [],
  fetchBudget: async () => {},
  frameworks: [],
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
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [tags, setTags] = useState<Tags[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [incomeFormAction, setIncomeFormAction] = useState<'create' | 'update'>(
    'create'
  );
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [borrowers, setBorrowers] = useState<string[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [budgetEnabled, setBudgetEnabled] = useState<boolean>(false);
  const [budgetFramework, setBudgetFramework] = useState<FrameworkMeta | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [frameworks, setFrameworks] = useState<FrameworkDefinition[]>([]);

  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchFundSources();
    fetchTransfers();
    fetchTags();
    fetchLendings();
    fetchRecurringExpenses();
    fetchAssets();
    fetchBudget();
    fetchFrameworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function fetchTransfers() {
    try {
      const response = await HttpClient.get<any>('/transfers');
      if (response && response.data) {
        setTransfers(response.data.transfers || []);
      }
    } catch (error: any) {
      console.error('Error fetching transfers:', error);
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

  async function fetchIncomes() {
    try {
      const response = await HttpClient.get<any>(
        '/incomes?month=' + selectedMonth
      );
      if (response && response.data) {
        setIncomes(response.data.incomes || []);
        setTotalIncome(response.data.totalIncome || 0);
      }
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchLendings() {
    try {
      const response = await HttpClient.get<any>('/lendings');
      if (response && response.data) {
        setLendings(response.data.lendings || []);
        setBorrowers(response.data.borrowers || []);
      }
    } catch (error: any) {
      console.error('Error fetching lendings:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchRecurringExpenses() {
    try {
      const response = await HttpClient.get<any>('/recurring-expenses');
      if (response && response.data) {
        setRecurringExpenses(response.data.recurringExpenses || []);
      }
    } catch (error: any) {
      console.error('Error fetching recurring expenses:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchAssets() {
    try {
      const response = await HttpClient.get<any>('/assets');
      if (response && response.data) {
        setAssets(response.data.assets || []);
      }
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchBudget() {
    try {
      const response = await HttpClient.get<any>('/budget');
      if (response && response.data) {
        setBudgetEnabled(response.data.config?.enabled ?? false);
        setBudgetFramework(response.data.framework ?? null);
        setBuckets(response.data.buckets ?? []);
      }
    } catch (error: any) {
      console.error('Error fetching budget:', error);
      showErrorSnackBar(error.message);
    }
  }

  async function fetchFrameworks() {
    try {
      const response = await HttpClient.get<any>('/budget/frameworks');
      if (response && response.data) {
        setFrameworks(response.data.frameworks || []);
      }
    } catch (error: any) {
      console.error('Error fetching frameworks:', error);
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
    fetchFundSources,
    transfers,
    fetchTransfers,
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
    incomes,
    totalIncome,
    selectedIncome,
    setSelectedIncome,
    fetchIncomes,
    incomeFormOpen,
    setIncomeFormOpen,
    incomeFormAction,
    setIncomeFormAction,
    lendings,
    borrowers,
    fetchLendings,
    recurringExpenses,
    fetchRecurringExpenses,
    assets,
    fetchAssets,
    budgetEnabled,
    budgetFramework,
    buckets,
    fetchBudget,
    frameworks,
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
