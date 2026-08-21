import { use, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RepeatIcon from '@mui/icons-material/Repeat';
import { AppContext } from '@/context/AppContext';
import { RecurringExpense } from '@/types/RecurringExpense';
import { HttpClient } from '@/utils/httpClient';
import RecurringExpenseItem from '@/components/atoms/RecurringExpenseItem';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';
import SummaryHeroCard from '@/components/molecules/SummaryHeroCard';
import RecurringExpenseDialog from '@/components/organisms/RecurringExpenseDialog';
import RecurringPaymentDialog from '@/components/organisms/RecurringPaymentDialog';
import RecurringExpenseDetailDialog from '@/components/organisms/RecurringExpenseDetailDialog';

const FREQUENCY_GROUPS: {
  frequency: RecurringExpense['frequency'];
  heading: string;
}[] = [
  { frequency: 'monthly', heading: 'Monthly' },
  { frequency: 'weekly', heading: 'Weekly' },
  { frequency: 'yearly', heading: 'Yearly' },
  { frequency: 'as_needed', heading: 'As Needed' },
];

export default function RecurringPage() {
  const {
    recurringExpenses,
    showSuccessSnackBar,
    showErrorSnackBar,
    invalidate,
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

  // Group by frequency so each row is spared a repeated "Monthly ·" label,
  // active commitments first within each group.
  const groups = FREQUENCY_GROUPS.map(({ frequency, heading }) => ({
    heading,
    items: recurringExpenses
      .filter((re) => re.frequency === frequency)
      .sort(
        (a, b) =>
          Number(b.status === 'active') - Number(a.status === 'active'),
      ),
  })).filter((group) => group.items.length > 0);

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
      invalidate.afterRecurringWrite();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  const handlePayFromDetail = (re: RecurringExpense) => {
    setDetailExpense(null);
    setPayingExpense(re);
  };

  const handleEditFromDetail = (re: RecurringExpense) => {
    setDetailExpense(null);
    handleEdit(re);
  };

  const handleDeleteFromDetail = (re: RecurringExpense) => {
    setDetailExpense(null);
    setDeleteTarget(re);
  };

  const handleUpdateStatus = async (re: RecurringExpense, status: string) => {
    try {
      await HttpClient.patch(
        `/recurring-expenses/${encodeURIComponent(re.name)}/status`,
        { status },
      );
      showSuccessSnackBar(`Recurring expense ${status} successfully`);
      invalidate.afterRecurringWrite();
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
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
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

      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        <SummaryHeroCard
          hue="info"
          icon={<RepeatIcon />}
          eyebrow="Recurring Expenses"
          label="Monthly projected"
          // Rounded here, not in the hero — §3 leaves rounding to the caller.
          amount={Math.round(totalProjected)}
          caption="upper bound · excludes as-needed"
          stats={[
            { value: activeCount, label: 'Active' },
            { value: recurringExpenses.length, label: 'Total' },
          ]}
        />

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
          <Stack spacing={2}>
            {groups.map((group, index) => (
              <LedgerGroupCard
                key={group.heading}
                label={group.heading}
                count={group.items.length}
                index={index}
              >
                {group.items.map((re) => (
                  <RecurringExpenseItem
                    key={re.name}
                    recurringExpense={re}
                    onTap={setDetailExpense}
                  />
                ))}
              </LedgerGroupCard>
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
