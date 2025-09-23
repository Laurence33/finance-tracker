import { Expense } from '@/types/Expense';
import { Box } from '@mui/material';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <Box
      key={expense.timestamp}
      sx={{ p: 1, border: '1px solid #ccc', borderRadius: '4px' }}
    >
      <div>{expense.fundSource}</div>
      <div>${expense.amount}</div>
      <div>{expense.timestamp}</div>
    </Box>
  );
}
