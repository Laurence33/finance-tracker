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
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { MdEdit, MdDelete } from 'react-icons/md';
import { AppContext } from '@/context/AppContext';
import { FundSource } from '@/types/FundSource';
import { HttpClient } from '@/utils/httpClient';
import ExpenseIcon from '@/components/atoms/ExpenseIcon';
import FundSourceDialog from '@/components/organisms/FundSourceDialog';

export default function WalletPage() {
  const theme = useTheme();
  const { fundSources, fetchFundSources, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFundSource, setEditingFundSource] = useState<FundSource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<FundSource | null>(null);

  const totalBalance = fundSources.reduce((sum, fs) => sum + fs.balance, 0);

  const handleCreate = () => {
    setEditingFundSource(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (fundSource: FundSource) => {
    setEditingFundSource(fundSource);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingFundSource(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(`/fund-sources/${deleteTarget.name}`);
      showSuccessSnackBar('Fund source deleted successfully');
      fetchFundSources();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <FundSourceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fundSource={editingFundSource}
      />

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete fund source?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.displayText}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: 'text.secondary' }}>
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
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
                <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography
                variant="caption"
                sx={{ opacity: 0.85, fontWeight: 500 }}
              >
                Total Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₱{totalBalance.toLocaleString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
        >
          Fund Sources
        </Typography>

        {fundSources.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AccountBalanceWalletIcon
              sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
            />
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
              No fund sources
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Tap the + button to add your first fund source
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {fundSources.map((fundSource) => (
              <Card
                key={fundSource.name}
                sx={{
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ExpenseIcon fundSource={fundSource.name} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {fundSource.displayText}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {fundSource.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        flexShrink: 0,
                      }}
                    >
                      ₱{fundSource.balance.toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(fundSource)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <MdEdit fontSize="1.1rem" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(fundSource)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' },
                        }}
                      >
                        <MdDelete fontSize="1.1rem" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="add fund source"
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
