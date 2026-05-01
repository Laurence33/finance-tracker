import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RecurringPaymentForm from '../molecules/RecurringPaymentForm';
import { RecurringExpense } from '@/types/RecurringExpense';

export default function RecurringPaymentDialog({
  open,
  onClose,
  recurringExpense,
}: {
  open: boolean;
  onClose: () => void;
  recurringExpense: RecurringExpense;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Pay Recurring Expense</Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <RecurringPaymentForm onClose={onClose} recurringExpense={recurringExpense} />
      </DialogContent>
    </Dialog>
  );
}
