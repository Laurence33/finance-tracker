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
import HandshakeIcon from '@mui/icons-material/Handshake';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AppContext } from '@/context/AppContext';
import { Lending } from '@/types/Lending';
import { HttpClient } from '@/utils/httpClient';
import LendingsList from '@/components/molecules/LendingsList';
import LendingDialog from '@/components/organisms/LendingDialog';
import LendingPaymentDialog from '@/components/organisms/LendingPaymentDialog';
import LendingDetailDialog from '@/components/organisms/LendingDetailDialog';

export default function LendingsPage() {
  const theme = useTheme();
  const { lendings, fetchLendings, fetchFundSources, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLending, setEditingLending] = useState<Lending | undefined>();
  const [payingLending, setPayingLending] = useState<Lending | null>(null);
  const [detailLending, setDetailLending] = useState<Lending | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lending | null>(null);

  const activeLendings = lendings.filter((l) => l.status !== 'paid');
  const totalLentOut = activeLendings.reduce(
    (sum, l) => sum + (l.amount - l.totalPaid),
    0,
  );
  const overdueCount = activeLendings.filter(
    (l) => new Date(l.promisedDate) < new Date(new Date().toDateString()),
  ).length;

  const handleCreate = () => {
    setEditingLending(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (lending: Lending) => {
    setEditingLending(lending);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingLending(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(
        `/lendings?timestamp=${encodeURIComponent(deleteTarget.timestamp)}`,
      );
      showSuccessSnackBar('Lending deleted successfully');
      fetchLendings();
      fetchFundSources();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  const handlePaymentClose = () => {
    setPayingLending(null);
  };

  const handleAddPaymentFromDetail = (lending: Lending) => {
    setDetailLending(null);
    setPayingLending(lending);
  };

  return (
    <>
      <LendingDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        lending={editingLending}
      />

      {payingLending && (
        <LendingPaymentDialog
          open={!!payingLending}
          onClose={handlePaymentClose}
          lending={payingLending}
        />
      )}

      <LendingDetailDialog
        open={!!detailLending}
        onClose={() => setDetailLending(null)}
        lending={detailLending}
        onAddPayment={handleAddPaymentFromDetail}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete lending?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the lending to{' '}
            <strong>{deleteTarget?.borrower}</strong> for ₱
            {deleteTarget?.amount.toLocaleString()}? The amount will be restored
            to the fund source.
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
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
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
                  <HandshakeIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.85, fontWeight: 500 }}
                >
                  Total Lent Out
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ₱{totalLentOut.toLocaleString()}
                </Typography>
              </Stack>
              {overdueCount > 0 && (
                <Stack alignItems="center" spacing={0.5}>
                  <WarningAmberIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {overdueCount}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.85, fontWeight: 500 }}
                  >
                    Overdue
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
        >
          Lendings ({lendings.length})
        </Typography>

        <LendingsList
          lendings={lendings}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onPay={setPayingLending}
          onTap={setDetailLending}
        />
      </Container>

      <Fab
        color="primary"
        aria-label="add lending"
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
