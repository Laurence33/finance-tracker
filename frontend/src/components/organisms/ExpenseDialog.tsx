import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import ExpenseForm from '../molecules/ExpenseForm';
import { AppContext } from '@/context/AppContext';
import { use } from 'react';

export default function ExpenseDialog() {
  const { formAction, expenseFormOpen, setExpenseFormOpen } = use(AppContext);
  return (
    <Dialog open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)}>
      <DialogTitle>
        {formAction === 'create' ? 'Create' : 'Update'} Expense
      </DialogTitle>
      <DialogContent sx={{ width: '400px' }}>
        <ExpenseForm />
      </DialogContent>
    </Dialog>
  );
}
