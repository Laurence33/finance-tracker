import { use, useState } from 'react';
import RowActions from './RowActions';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { Expense } from '@/types/Expense';
import ExpenseIconRenderer from './ExpenseIcon';
import LedgerRow from './LedgerRow';
import { HttpClient } from '@/utils/httpClient';
import { AppContext } from '@/context/AppContext';
import { transactionTime } from '@/utils/transaction-display';

/**
 * Binds an expense to the shared ledger row (§2 of `docs/ui-patterns.md`). All
 * the vocabulary lives here: an expense has no name of its own, so its notes
 * carry the row and the fund source names it when there are none; tags and the
 * time of day collapse into the dot-separated meta line. The date is deliberately
 * absent — `TransactionsList` hoists it into the group header.
 */
export default function ExpenseItem({ expense }: { expense: Expense }) {
  const {
    fetchExpenses,
    fetchFundSources,
    showSuccessSnackBar,
    showErrorSnackBar,
    setSelectedExpense,
    setFormAction,
    setExpenseFormOpen,
    fundSources,
  } = use(AppContext);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteClickHandler = async () => {
    handleClickOpen();
  };

  const deleteExpense = async () => {
    try {
      await HttpClient.delete(`/expenses?timestamp=${expense.timestamp}`);
      showSuccessSnackBar('Expense deleted successfully');
      fetchExpenses();
      fetchFundSources();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      showErrorSnackBar(error.message);
    }
  };

  const editClickHandler = () => {
    setSelectedExpense(expense);
    setFormAction('update');
    setExpenseFormOpen(true);
  };

  const fundSourceLabel =
    fundSources.find((fs) => fs.name === expense.fundSource)?.displayText ??
    expense.fundSource;

  // Notes are the only free-text description an expense has, so they are the
  // name; `LedgerRow` clamps them to two lines. Falling back to the fund source
  // keeps a bare record readable without repeating a tag that the meta line
  // already shows.
  const name = expense.notes || fundSourceLabel || 'Expense';
  const meta = [transactionTime(expense.timestamp), ...(expense.tags ?? [])]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete this expense?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={deleteExpense}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <LedgerRow
        leading={<ExpenseIconRenderer fundSource={expense.fundSource} />}
        name={name}
        meta={meta}
        amount={expense.amount}
        trailing={
          <RowActions
            onEdit={editClickHandler}
            onDelete={deleteClickHandler}
            editLabel="Edit expense"
            deleteLabel="Delete expense"
          />
        }
      />
    </>
  );
}
