import { Expense } from '@/types/Expense';
import { Box, Divider, IconButton, Stack } from '@mui/material';
import { MdDelete, MdEdit } from 'react-icons/md';
import ExpenseIconRenderer from './ExpenseIcon';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <Stack
      direction="row"
      justifyContent={'space-between'}
      key={expense.timestamp}
      sx={{ border: '1px solid #ccc', borderRadius: '4px' }}
    >
      <Stack direction="row">
        <Stack
          direction="column"
          alignItems={'center'}
          justifyContent={'center'}
          padding={'.5rem'}
        >
          <ExpenseIconRenderer fundSource={expense.fundSource} />
        </Stack>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box>₱{expense.amount}</Box>
          <Box sx={{ color: '#636363ff' }}>{expense.timestamp}</Box>
        </Box>
      </Stack>
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
