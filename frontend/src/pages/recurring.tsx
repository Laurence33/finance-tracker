import { use, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RepeatIcon from '@mui/icons-material/Repeat';
import { AppContext } from '@/context/AppContext';
import { RecurringExpense } from '@/types/RecurringExpense';
import { HttpClient } from '@/utils/httpClient';
import RecurringExpenseItem from '@/components/atoms/RecurringExpenseItem';
import RecurringExpenseDialog from '@/components/organisms/RecurringExpenseDialog';
import RecurringPaymentDialog from '@/components/organisms/RecurringPaymentDialog';
import RecurringExpenseDetailDialog from '@/components/organisms/RecurringExpenseDetailDialog';

export default function RecurringPage() {
  const theme = useTheme();
  const {
    recurringExpenses,
    fetchRecurringExpenses,
    showSuccessSnackBar,
    showErrorSnackBar,
  } = use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | undefined>();
  const [payingExpense, setPayingExpense] = useState<RecurringExpense | null>(null);
  const [detailExpense, setDetailExpense] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);

  const activeCount = recurringExpenses.filter((re) => re.status === 'active').length;
  // Project monthly equivalent (excluding as_needed)
  const totalProjected = recurringExpenses
    .filter((re) => re.status === 'active' && re.frequency !== 'as_needed')
    .reduce((sum, re) => {
      const amount = re.amountType === 'fixed' ? re.amount : re.amountMax;
      if (re.frequency === 'monthly') return sum + amount;
      if (re.frequency === 'weekly') return sum + amount * 4;
      if (re.frequency === 'yearly') return sum + amount / 12;
      return sum;
    }, 0);

  const handleCreate = () => {
    setEditingExpense(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (re: RecurringExpense) => {
    setEditingExpense(re);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExpense(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(
        `/recurring-expenses/${encodeURIComponent(deleteTarget.name)}`,
      );
      showSuccessSnackBar('Recurring expense deleted successfully');
      fetchRecurringExpenses();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  const handlePayFromDetail = (re: RecurringExpense) => {
    setDetailExpense(null);
    setPayingExpense(re);
  };

  const handleUpdateStatus = async (re: RecurringExpense, status: string) => {
    try {
      await HttpClient.patch(
        `/recurring-expenses/${encodeURIComponent(re.name)}/status`,
        { status },
      );
      showSuccessSnackBar(`Recurring expense ${status} successfully`);
      fetchRecurringExpenses();
      setDetailExpense(null);
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
  };

  return (
    <>
      <RecurringExpenseDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        recurringExpense={editingExpense}
      />

      {payingExpense && (
        <RecurringPaymentDialog
          open={!!payingExpense}
          onClose={() => setPayingExpense(null)}
          recurringExpense={payingExpense}
        />
      )}

      <RecurringExpenseDetailDialog
        open={!!detailExpense}
        onClose={() => setDetailExpense(null)}
        recurringExpense={detailExpense}
        onPay={handlePayFromDetail}
        onUpdateStatus={handleUpdateStatus}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete recurring expense?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.displayName}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Card
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Stack alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha('#ffffff', 0.2),
                  }}
                >
                  <RepeatIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.85, fontWeight: 500 }}
                >
                  Monthly Projected
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ₱{Math.round(totalProjected).toLocaleString()}
                </Typography>
              </Stack>
              <Stack alignItems="center" spacing={0.5}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {activeCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.85, fontWeight: 500 }}
                >
                  Active
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
        >
          Recurring Expenses ({recurringExpenses.length})
        </Typography>

        {recurringExpenses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <RepeatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" sx={{ color: 'text.disabled' }}>
              No recurring expenses yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
              Add subscriptions and regular bills to track them
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {recurringExpenses.map((re) => (
              <RecurringExpenseItem
                key={re.name}
                recurringExpense={re}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onTap={setDetailExpense}
              />
            ))}
          </Stack>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="add recurring expense"
        onClick={handleCreate}
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
