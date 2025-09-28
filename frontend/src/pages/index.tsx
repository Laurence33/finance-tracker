import React, { useEffect, use, useState } from 'react';
import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';
import AddExpenseDialog from '@/components/organisms/AddExpenseDialog';

export default function Home() {
  const { expenses, fetchExpenses } = use(AppContext);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <>
      <AddExpenseDialog open={open} handleClose={() => setOpen(false)} />
      <Box sx={{ mt: 5, px: 2, maxWidth: '100%' }}>
        <Stack direction="row" justifyContent="end" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Expense
          </Button>
        </Stack>
        <ExpenseList expenses={expenses} />
      </Box>
    </>
  );
}
