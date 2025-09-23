import { Expense } from '@/types/Expense';
import { Box, Divider, IconButton, Stack } from '@mui/material';
import { MdDelete } from 'react-icons/md';
import { MdEdit } from 'react-icons/md';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <Stack
      direction="row"
      justifyContent={'space-between'}
      spacing={0.5}
      key={expense.timestamp}
      sx={{ border: '1px solid #ccc', borderRadius: '4px' }}
    >
      <Box sx={{ p: 1 }}>
        <div>{expense.fundSource}</div>
        <div>₱{expense.amount}</div>
        <div>{expense.timestamp}</div>
      </Box>
      <Box
        sx={{
          boxShadow: '-2px 0 12px -6px rgba(0,0,0,0.8)',
        }}
        paddingLeft=".5rem"
        paddingRight=".25rem"
        borderRadius={'4px'}
      >
        <Stack
          spacing={0.125}
          direction="column"
          alignItems={'center'}
          justifyContent={'space-around'}
          justifyItems={'center'}
        >
          <IconButton color="primary" aria-label="edit expense" sx={{}}>
            <MdEdit fontSize={'1.25rem'} />
          </IconButton>
          <Divider flexItem />
          <IconButton color="error" aria-label="delete expense">
            <MdDelete fontSize={'1.25rem'} />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  );
}
