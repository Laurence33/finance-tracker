import { use, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  Typography,
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

  const formattedTime = expense.timestamp.split(' ')[1]?.slice(0, 5) || '';
  const formattedDate = expense.timestamp.split(' ')[0] || expense.timestamp;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete this expense?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={deleteExpense}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Card
        sx={{
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Icon */}
            <ExpenseIconRenderer fundSource={expense.fundSource} />

            {/* Details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    ₱{expense.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formattedDate} {formattedTime && `at ${formattedTime}`}
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={0} sx={{ ml: 1, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={editClickHandler}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <MdEdit fontSize="1.1rem" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={deleteClickHandler}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    <MdDelete fontSize="1.1rem" />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Tags */}
              {expense.tags && expense.tags.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ mt: 1 }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {expense.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        borderColor: 'divider',
                        color: 'text.secondary',
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Notes */}
              {expense.notes && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.75,
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {expense.notes}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
