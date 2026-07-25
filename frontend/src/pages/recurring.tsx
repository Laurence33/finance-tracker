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
  Divider,
  Fab,
  Stack,
  Typography,
  alpha,
  keyframes,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RepeatIcon from '@mui/icons-material/Repeat';
import { AppContext } from '@/context/AppContext';
import { RecurringExpense } from '@/types/RecurringExpense';
import { HttpClient } from '@/utils/httpClient';
import Money from '@/components/atoms/Money';
import RecurringExpenseItem from '@/components/atoms/RecurringExpenseItem';
import RecurringExpenseDialog from '@/components/organisms/RecurringExpenseDialog';
import RecurringPaymentDialog from '@/components/organisms/RecurringPaymentDialog';
import RecurringExpenseDetailDialog from '@/components/organisms/RecurringExpenseDetailDialog';

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

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
        <Card
          sx={{
            mb: 2.5,
            position: 'relative',
            overflow: 'hidden',
            border: 'none',
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white',
          }}
        >
          {/* Soft highlight so the gradient reads as depth rather than a flat wash */}
          <Box
            sx={{
              position: 'absolute',
              top: -72,
              right: -48,
              width: 216,
              height: 216,
              borderRadius: '50%',
              bgcolor: alpha('#ffffff', 0.09),
            }}
          />
          <CardContent
            sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, position: 'relative' }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <RepeatIcon sx={{ fontSize: 16, opacity: 0.9 }} />
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  opacity: 0.9,
                }}
              >
                Recurring Expenses
              </Typography>
            </Stack>

            <Stack
              direction="row"
              alignItems="flex-end"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.85 }}
                >
                  Monthly projected
                </Typography>
                <Money
                  surface="onColor"
                  amount={Math.round(totalProjected)}
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                  }}
                />
                <Typography sx={{ fontSize: '0.6875rem', opacity: 0.7, mt: 0.25 }}>
                  upper bound · excludes as-needed
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1.75}
                divider={
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ borderColor: alpha('#ffffff', 0.25) }}
                  />
                }
                sx={{ flexShrink: 0 }}
              >
                {[
                  { value: activeCount, label: 'Active' },
                  { value: recurringExpenses.length, label: 'Total' },
                ].map((stat) => (
                  <Stack key={stat.label} alignItems="center" spacing={0.25}>
                    <Typography
                      sx={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        opacity: 0.8,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

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
              <Card
                key={group.heading}
                sx={{
                  overflow: 'hidden',
                  animation: `${riseIn} 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) both`,
                  animationDelay: `${index * 70}ms`,
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'primary.dark',
                    }}
                  >
                    {group.heading}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: 'text.secondary',
                    }}
                  >
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'item' : 'items'}
                  </Typography>
                </Stack>

                <Stack divider={<Divider />}>
                  {group.items.map((re) => (
                    <RecurringExpenseItem
                      key={re.name}
                      recurringExpense={re}
                      onTap={setDetailExpense}
                    />
                  ))}
                </Stack>
              </Card>
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
