import { use, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { Income } from '@/types/Income';
import ExpenseIconRenderer from './ExpenseIcon';
import LedgerRow from './LedgerRow';
import Money from './Money';
import { HttpClient } from '@/utils/httpClient';
import { AppContext } from '@/context/AppContext';
import { transactionTime } from '@/utils/transaction-display';

/**
 * Binds an income record to the shared ledger row (§2 of `docs/ui-patterns.md`).
 * It shares the list with expenses, so the only thing marking it out is its
 * figure: a leading `+` and `success.main`. No badge — that would be §4's
 * majority-state chip on whichever filter the user is in.
 *
 * The amount goes through the `value` slot rather than `amount`, because
 * `LedgerRow` owns the colour of the figure it builds itself. The typography
 * below is the row spec's, restated only so the colour can change.
 */
export default function IncomeItem({ income }: { income: Income }) {
  const {
    fetchIncomes,
    fetchFundSources,
    showSuccessSnackBar,
    showErrorSnackBar,
    setSelectedIncome,
    setIncomeFormAction,
    setIncomeFormOpen,
    fundSources,
  } = use(AppContext);
  const [open, setOpen] = useState(false);

  const deleteIncome = async () => {
    try {
      await HttpClient.delete(`/incomes?timestamp=${income.timestamp}`);
      showSuccessSnackBar('Income deleted successfully');
      fetchIncomes();
      fetchFundSources();
    } catch (error: any) {
      console.error('Error deleting income:', error);
      showErrorSnackBar(error.message);
    }
  };

  const editClickHandler = () => {
    setSelectedIncome(income);
    setIncomeFormAction('update');
    setIncomeFormOpen(true);
  };

  const fundSourceLabel =
    fundSources.find((fs) => fs.name === income.fundSource)?.displayText ??
    income.fundSource;

  // Unlike an expense, income has a name of its own — where it came from. That
  // frees the notes to sit in the meta line, after the tags, so the scannable
  // parts survive the ellipsis.
  const name = income.source || income.notes || fundSourceLabel || 'Income';
  const meta = [
    transactionTime(income.timestamp),
    ...(income.tags ?? []),
    income.source ? income.notes : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete this income?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this income record? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={deleteIncome} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <LedgerRow
        leading={<ExpenseIconRenderer fundSource={income.fundSource} />}
        name={name}
        meta={meta}
        value={
          <Money
            amount={income.amount}
            sign="+"
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              lineHeight: 1.3,
              color: 'success.main',
            }}
          />
        }
        trailing={
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={editClickHandler}
              aria-label="Edit income"
              sx={{
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MdEdit fontSize="1.1rem" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpen(true)}
              aria-label="Delete income"
              sx={{
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'error.main' },
              }}
            >
              <MdDelete fontSize="1.1rem" />
            </IconButton>
          </Stack>
        }
      />
    </>
  );
}
