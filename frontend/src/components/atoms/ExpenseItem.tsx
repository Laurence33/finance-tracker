import { use, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { Expense } from '@/types/Expense';
import ExpenseIconRenderer from './ExpenseIcon';
import { HttpClient } from '@/utils/httpClient';
import { AppContext } from '@/context/AppContext';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  const {
    fetchExpenses,
    showSuccessSnackBar,
    showErrorSnackBar,
    setSelectedExpense,
    setFormAction,
    setExpenseFormOpen,
  } = use(AppContext);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteClickHandler = async () => {
    console.log('Delete clicked for expense:', expense);
    handleClickOpen();
  };

  const deleteExpense = async () => {
    try {
      await HttpClient.delete(`/expenses?timestamp=${expense.timestamp}`);
      showSuccessSnackBar('Expense deleted successfully');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      showErrorSnackBar(error.message);
    }
  };

  const editClickHandler = () => {
    setSelectedExpense(expense);
    setFormAction('update');
    setExpenseFormOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Delete this expense?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={deleteExpense} autoFocus color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

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
            <Box fontWeight={700}>₱{expense.amount}</Box>
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
            <IconButton
              color="primary"
              aria-label="edit expense"
              onClick={editClickHandler}
            >
              <MdEdit fontSize={'1.25rem'} />
            </IconButton>
            <Divider flexItem />
            <IconButton
              color="error"
              aria-label="delete expense"
              onClick={deleteClickHandler}
            >
              <MdDelete fontSize={'1.25rem'} />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </>
  );
}
