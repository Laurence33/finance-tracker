import { Expense } from '@/types/Expense';
import { Box, Stack } from '@mui/material';
import ExpenseItem from '../atoms/ExpenseItem';

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <Box component="div" sx={{ height: '85vh', overflow: 'scroll' }}>
      <Stack spacing={1}>
        {expenses.map((expense) => (
          <ExpenseItem key={expense.timestamp} expense={expense} />
        ))}
      </Stack>
    </Box>
  );
}
