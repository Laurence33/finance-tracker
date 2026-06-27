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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { AppContext } from '@/context/AppContext';
import { Asset } from '@/types/Asset';
import { HttpClient } from '@/utils/httpClient';
import AssetsList from '@/components/molecules/AssetsList';
import AssetDialog from '@/components/organisms/AssetDialog';

export default function AssetsPage() {
  const theme = useTheme();
  const { assets, fetchAssets, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

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
      fetchAssets();
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
            (₱{deleteTarget?.value.toLocaleString()})?
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
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Stack alignItems="center" spacing={1}>
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
                <AccountBalanceIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography
                variant="caption"
                sx={{ opacity: 0.85, fontWeight: 500 }}
              >
                Total Assets
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₱{totalValue.toLocaleString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
        >
          Assets ({assets.length})
        </Typography>

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
