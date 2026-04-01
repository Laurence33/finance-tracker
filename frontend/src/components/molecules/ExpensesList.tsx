import { Expense } from '@/types/Expense';
import { Box, Stack, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ExpenseItem from '../atoms/ExpenseItem';

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 3,
        }}
      >
        <ReceiptLongIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No expenses yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to add your first expense for this month
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="div" sx={{ overflow: 'auto', pb: 2 }}>
      <Stack spacing={1.5}>
        {expenses.map((expense) => (
          <ExpenseItem key={expense.timestamp} expense={expense} />
        ))}
      </Stack>
    </Box>
  );
}
