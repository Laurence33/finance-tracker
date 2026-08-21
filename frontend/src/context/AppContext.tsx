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
import { KEYS } from '@/utils/swr-keys';
import { buildInvalidators, Invalidators } from '@/utils/invalidation';
import { TZDate } from '@date-fns/tz';
import { Alert, Snackbar } from '@mui/material';
import { format } from 'date-fns';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

interface AppContextType {
  expenses: Expense[];
  totalExpenses: number;
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
  fetchFundSources: () => Promise<void>;
  transfers: Transfer[];
  fetchTransfers: () => Promise<void>;
  tags: Tags[];
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
  /**
   * What each mutation makes stale, in one place. Prefer these over calling
   * several `fetchX` in a row: the map is derived from what the backend writes
   * in one transaction, and getting that wrong is how both stale-budget bugs
   * happened. See `@/utils/invalidation`.
   */
  invalidate: Invalidators;
}

// Stable identities, so a consumer's useMemo doesn't re-run on every render
// while a request is still in flight.
const NO_EXPENSES: Expense[] = [];
const NO_INCOMES: Income[] = [];
const NO_FUND_SOURCES: FundSource[] = [];
const NO_TRANSFERS: Transfer[] = [];
const NO_TAGS: Tags[] = [];
const NO_LENDINGS: Lending[] = [];
const NO_BORROWERS: string[] = [];
const NO_RECURRING: RecurringExpense[] = [];
const NO_ASSETS: Asset[] = [];
const NO_BUCKETS: Bucket[] = [];
const NO_FRAMEWORKS: FrameworkDefinition[] = [];

const noop = async () => {};

export const AppContext = createContext<AppContextType>({
  expenses: NO_EXPENSES,
  totalExpenses: 0,
  selectedExpense: null,
  setSelectedExpense: () => {},
  fetchExpenses: noop,
  snackBarState: { open: false, message: '', severity: 'success' },
  showSuccessSnackBar: () => {},
  showErrorSnackBar: () => {},
  handleSnackBarClose: () => {},
  formAction: 'create',
  setFormAction: () => {},
  expenseFormOpen: false,
  setExpenseFormOpen: () => {},
  selectedMonth: format(TZDate.tz('asia/singapore'), 'yyyy-MM'),
  setSelectedMonth: () => {},
  fundSources: NO_FUND_SOURCES,
  fetchFundSources: noop,
  transfers: NO_TRANSFERS,
  fetchTransfers: noop,
  tags: NO_TAGS,
  fetchTags: noop,
  incomes: NO_INCOMES,
  totalIncome: 0,
  selectedIncome: null,
  setSelectedIncome: () => {},
  fetchIncomes: noop,
  incomeFormOpen: false,
  setIncomeFormOpen: () => {},
  incomeFormAction: 'create',
  setIncomeFormAction: () => {},
  lendings: NO_LENDINGS,
  borrowers: NO_BORROWERS,
  fetchLendings: noop,
  recurringExpenses: NO_RECURRING,
  fetchRecurringExpenses: noop,
  assets: NO_ASSETS,
  fetchAssets: noop,
  budgetEnabled: false,
  budgetFramework: null,
  buckets: NO_BUCKETS,
  fetchBudget: noop,
  frameworks: NO_FRAMEWORKS,
  invalidate: {} as Invalidators,
});

export const swrFetcher = (url: string) => HttpClient.get<any>(url);

export default function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mutate } = useSWRConfig();

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formAction, setFormAction] = useState<'create' | 'update'>('create');
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(TZDate.tz('asia/singapore'), 'yyyy-MM')
  );
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [incomeFormAction, setIncomeFormAction] = useState<'create' | 'update'>(
    'create'
  );
  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSuccessSnackBar = useCallback((message: string) => {
    setSnackBarState({ open: true, message, severity: 'success' });
  }, []);

  const showErrorSnackBar = useCallback((message: string) => {
    setSnackBarState({ open: true, message, severity: 'error' });
  }, []);

  const handleSnackBarClose = useCallback(() => {
    setSnackBarState((prev) => ({ ...prev, open: false }));
  }, []);

  const onError = useCallback(
    (error: Error) => showErrorSnackBar(error.message),
    [showErrorSnackBar]
  );
  const swrOptions = useMemo(() => ({ onError }), [onError]);

  const expensesKey = KEYS.expenses(selectedMonth);
  const incomesKey = KEYS.incomes(selectedMonth);

  const { data: expensesRes } = useSWR(expensesKey, swrFetcher, swrOptions);
  const { data: incomesRes } = useSWR(incomesKey, swrFetcher, swrOptions);
  const { data: fundSourcesRes } = useSWR(KEYS.fundSources, swrFetcher, swrOptions);
  const { data: transfersRes } = useSWR(KEYS.transfers, swrFetcher, swrOptions);
  const { data: tagsRes } = useSWR(KEYS.tags, swrFetcher, swrOptions);
  const { data: lendingsRes } = useSWR(KEYS.lendings, swrFetcher, swrOptions);
  const { data: recurringRes } = useSWR(KEYS.recurringExpenses, swrFetcher, swrOptions);
  const { data: assetsRes } = useSWR(KEYS.assets, swrFetcher, swrOptions);
  const { data: budgetRes } = useSWR(KEYS.budget, swrFetcher, swrOptions);
  const { data: frameworksRes } = useSWR(KEYS.frameworks, swrFetcher, swrOptions);

  const expenses = expensesRes?.data?.expenses ?? NO_EXPENSES;
  const totalExpenses = expensesRes?.data?.totalExpenses ?? 0;
  const incomes = incomesRes?.data?.incomes ?? NO_INCOMES;
  const totalIncome = incomesRes?.data?.totalIncome ?? 0;
  const fundSources = fundSourcesRes?.data?.fundSources ?? NO_FUND_SOURCES;
  const transfers = transfersRes?.data?.transfers ?? NO_TRANSFERS;
  const tags = tagsRes?.data?.tags ?? NO_TAGS;
  const lendings = lendingsRes?.data?.lendings ?? NO_LENDINGS;
  const borrowers = lendingsRes?.data?.borrowers ?? NO_BORROWERS;
  const recurringExpenses = recurringRes?.data?.recurringExpenses ?? NO_RECURRING;
  const assets = assetsRes?.data?.assets ?? NO_ASSETS;
  const budgetEnabled = budgetRes?.data?.config?.enabled ?? false;
  const budgetFramework = budgetRes?.data?.framework ?? null;
  const buckets = budgetRes?.data?.buckets ?? NO_BUCKETS;
  const frameworks = frameworksRes?.data?.frameworks ?? NO_FRAMEWORKS;

  // Read through a ref so the invalidators stay referentially stable across
  // month changes while still targeting the month the user is looking at.
  const monthRef = useRef(selectedMonth);
  monthRef.current = selectedMonth;
  const invalidate = useMemo(
    () => buildInvalidators(mutate, () => monthRef.current),
    [mutate]
  );

  // The `fetchX` names predate SWR and are kept so no consumer had to change.
  // Each is now "this key is stale, go get it".
  const revalidate = useCallback(
    async (key: string) => {
      await mutate(key);
    },
    [mutate]
  );
  const fetchExpenses = useCallback(
    () => revalidate(KEYS.expenses(monthRef.current)),
    [revalidate]
  );
  const fetchIncomes = useCallback(
    () => revalidate(KEYS.incomes(monthRef.current)),
    [revalidate]
  );
  const fetchFundSources = useCallback(() => revalidate(KEYS.fundSources), [revalidate]);
  const fetchTransfers = useCallback(() => revalidate(KEYS.transfers), [revalidate]);
  const fetchTags = useCallback(() => revalidate(KEYS.tags), [revalidate]);
  const fetchLendings = useCallback(() => revalidate(KEYS.lendings), [revalidate]);
  const fetchRecurringExpenses = useCallback(
    () => revalidate(KEYS.recurringExpenses),
    [revalidate]
  );
  const fetchAssets = useCallback(() => revalidate(KEYS.assets), [revalidate]);
  const fetchBudget = useCallback(() => revalidate(KEYS.budget), [revalidate]);

  const contextValue: AppContextType = {
    expenses,
    totalExpenses,
    selectedExpense,
    setSelectedExpense,
    fundSources,
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
    invalidate,
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
