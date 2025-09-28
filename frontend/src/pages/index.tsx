import Box from '@mui/material/Box';
import React, { useEffect, use } from 'react';
import CreateExpenseForm from '@/components/molecules/CreateExpenseForm';
import ExpenseList from '@/components/molecules/ExpensesList';
import { AppContext } from '@/context/AppContext';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function Home() {
  const { showErrorSnackBar, showSuccessSnackBar, expenses, fetchExpenses } =
    use(AppContext);

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent sx={{ width: '400px' }}>
          <CreateExpenseForm
            fetchExpenses={fetchExpenses}
            showErrorSnackBar={showErrorSnackBar}
            showSuccessSnackBar={showSuccessSnackBar}
          />
        </DialogContent>
      </Dialog>
      <Box sx={{ mt: 5, px: 2, maxWidth: '100%' }}>
        <Stack direction="row" justifyContent="end" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Add Expense
          </Button>
        </Stack>
        <ExpenseList expenses={expenses} />
      </Box>
    </>
  );
}
