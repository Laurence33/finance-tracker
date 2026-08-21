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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { AppContext } from '@/context/AppContext';
import { Asset } from '@/types/Asset';
import { HttpClient } from '@/utils/httpClient';
import { formatMoneyLong } from '@/utils/money';
import AssetsList from '@/components/molecules/AssetsList';
import SummaryHeroCard from '@/components/molecules/SummaryHeroCard';
import AssetDialog from '@/components/organisms/AssetDialog';

export default function AssetsPage() {
  const { assets, invalidate, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  // Counts the named categories only — an uncategorised asset gets a group in
  // the list, but it is a residue rather than a category worth counting.
  const categoryCount = new Set(
    assets.map((a) => a.category?.trim()).filter(Boolean),
  ).size;

  const handleCreate = () => {
    setEditingAsset(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAsset(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(
        `/assets?timestamp=${encodeURIComponent(deleteTarget.timestamp)}`,
      );
      showSuccessSnackBar('Asset deleted successfully');
      invalidate.afterAssetWrite();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <AssetDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        asset={editingAsset}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete asset?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>{' '}
            ({deleteTarget ? formatMoneyLong(deleteTarget.value) : ''})?
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

      {/* pb: 12 is FAB clearance and load-bearing — see §6. */}
      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        <SummaryHeroCard
          hue="success"
          icon={<AccountBalanceIcon />}
          eyebrow="Assets"
          label="Total value"
          // Rounded here, not in the hero — §3 leaves rounding to the caller.
          amount={Math.round(totalValue)}
          caption="sum of all recorded values"
          stats={[
            { value: assets.length, label: 'Holdings' },
            { value: categoryCount, label: 'Categories' },
          ]}
        />

        <AssetsList
          assets={assets}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      </Container>

      <Fab
        color="primary"
        aria-label="add asset"
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
