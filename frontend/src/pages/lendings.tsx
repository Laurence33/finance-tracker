import { use, useState } from 'react';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HandshakeIcon from '@mui/icons-material/Handshake';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AppContext } from '@/context/AppContext';
import { Lending } from '@/types/Lending';
import { HttpClient } from '@/utils/httpClient';
import { getLendingRemaining, isLendingOverdue } from '@/utils/lending-helpers';
import { formatMoneyLong } from '@/utils/money';
import LendingsList from '@/components/molecules/LendingsList';
import SummaryHeroCard, {
  SummaryHeroStat,
} from '@/components/molecules/SummaryHeroCard';
import LendingDialog from '@/components/organisms/LendingDialog';
import LendingPaymentDialog from '@/components/organisms/LendingPaymentDialog';
import LendingDetailDialog from '@/components/organisms/LendingDetailDialog';

export default function LendingsPage() {
  const { lendings, invalidate, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLending, setEditingLending] = useState<Lending | undefined>();
  const [payingLending, setPayingLending] = useState<Lending | null>(null);
  const [detailLending, setDetailLending] = useState<Lending | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lending | null>(null);

  const unsettled = lendings.filter((l) => l.status !== 'paid');
  const totalLentOut = unsettled.reduce(
    (sum, l) => sum + getLendingRemaining(l),
    0,
  );
  const overdueCount = unsettled.filter(isLendingOverdue).length;

  // One conditional stat, which §5 explicitly allows: a permanent `0 Overdue`
  // would be noise, and the group headers already carry the per-status counts
  // that the old `Lendings (N)` heading used to show.
  //
  // Deliberately the *only* stat. A stat carrying an icon is taller than one
  // without, and `SummaryHeroCard` stacks the icon above the value, so pairing
  // this with a plain second stat leaves their figures on different baselines.
  const stats: SummaryHeroStat[] =
    overdueCount > 0
      ? [{ value: overdueCount, label: 'Overdue', icon: <WarningAmberIcon /> }]
      : [];

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
      invalidate.afterLendingWrite();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  const handlePaymentClose = () => {
    setPayingLending(null);
  };

  // The detail dialog owns pay / edit / delete now that the row has no icons.
  // Every one of these closes the detail view *first* — otherwise the form
  // renders stacked on top of it.
  const handlePayFromDetail = (lending: Lending) => {
    setDetailLending(null);
    setPayingLending(lending);
  };

  const handleEditFromDetail = (lending: Lending) => {
    setDetailLending(null);
    handleEdit(lending);
  };

  const handleDeleteFromDetail = (lending: Lending) => {
    setDetailLending(null);
    setDeleteTarget(lending);
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
        onPay={handlePayFromDetail}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete lending?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the lending to{' '}
            <strong>{deleteTarget?.borrower}</strong> for{' '}
            {deleteTarget ? formatMoneyLong(deleteTarget.amount) : ''}? The
            amount will be restored to the fund source.
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

      {/* pb: 12 is FAB clearance and is load-bearing — see §6. */}
      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        <SummaryHeroCard
          hue="warning"
          icon={<HandshakeIcon />}
          eyebrow="Lendings"
          label="Outstanding"
          // Rounded here, not in the hero — §3 leaves rounding to the caller.
          amount={Math.round(totalLentOut)}
          caption="unpaid balance · excludes settled"
          stats={stats}
        />

        <LendingsList lendings={lendings} onTap={setDetailLending} />
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
