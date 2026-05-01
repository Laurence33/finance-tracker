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
import { Income } from '@/types/Income';
import ExpenseIconRenderer from './ExpenseIcon';
import { HttpClient } from '@/utils/httpClient';
import { AppContext } from '@/context/AppContext';

export default function IncomeItem({ income }: { income: Income }) {
  const {
    fetchIncomes,
    fetchFundSources,
    showSuccessSnackBar,
    showErrorSnackBar,
    setSelectedIncome,
    setIncomeFormAction,
    setIncomeFormOpen,
  } = use(AppContext);
  const [open, setOpen] = useState(false);

  const deleteIncome = async () => {
    try {
      await HttpClient.delete(`/incomes?timestamp=${income.timestamp}`);
      showSuccessSnackBar('Income deleted successfully');
      fetchIncomes();
      fetchFundSources();
    } catch (error: any) {
      console.error('Error deleting income:', error);
      showErrorSnackBar(error.message);
    }
  };

  const editClickHandler = () => {
    setSelectedIncome(income);
    setIncomeFormAction('update');
    setIncomeFormOpen(true);
  };

  const formattedTime = income.timestamp.split(' ')[1]?.slice(0, 5) || '';
  const formattedDate = income.timestamp.split(' ')[0] || income.timestamp;

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete this income?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this income record? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={deleteIncome} variant="contained" color="error" autoFocus>
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
          borderLeft: '3px solid',
          borderColor: 'success.main',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ExpenseIconRenderer fundSource={income.fundSource} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 700, color: 'success.main' }}
                  >
                    +₱{income.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {income.source} · {formattedDate} {formattedTime && `at ${formattedTime}`}
                  </Typography>
                </Box>

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
                    onClick={() => setOpen(true)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    <MdDelete fontSize="1.1rem" />
                  </IconButton>
                </Stack>
              </Stack>

              {income.tags && income.tags.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ mt: 1 }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {income.tags.map((tag) => (
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

              {income.notes && (
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
                  {income.notes}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
