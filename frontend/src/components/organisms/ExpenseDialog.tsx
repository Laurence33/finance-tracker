import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpenseForm from '../molecules/ExpenseForm';
import { AppContext } from '@/context/AppContext';
import { use } from 'react';

export default function ExpenseDialog() {
  const { formAction, expenseFormOpen, setExpenseFormOpen } = use(AppContext);
  return (
    <Dialog
      open={expenseFormOpen}
      onClose={() => setExpenseFormOpen(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {formAction === 'create' ? 'New Expense' : 'Edit Expense'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setExpenseFormOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <ExpenseForm />
      </DialogContent>
    </Dialog>
  );
}
