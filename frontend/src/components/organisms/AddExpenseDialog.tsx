import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import CreateExpenseForm from '../molecules/CreateExpenseForm';

export default function AddExpenseDialog({
  open,
  handleClose,
}: {
  open: boolean;
  handleClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add Expense</DialogTitle>
      <DialogContent sx={{ width: '400px' }}>
        <CreateExpenseForm />
      </DialogContent>
    </Dialog>
  );
}
