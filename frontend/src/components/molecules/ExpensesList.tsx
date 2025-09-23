import { Expense } from '@/types/Expense';
import { Box, Stack } from '@mui/material';
import ExpenseItem from '../atoms/ExpenseItem';

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <Box
      component="div"
      sx={{ ml: 6, p: 2, width: 340, height: 280, overflow: 'scroll' }}
    >
      <Stack spacing={1}>
        {expenses.map((expense) => (
          <ExpenseItem key={expense.timestamp} expense={expense} />
        ))}
      </Stack>
    </Box>
  );
}
