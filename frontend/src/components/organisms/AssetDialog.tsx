import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssetForm from '../molecules/AssetForm';
import { Asset } from '@/types/Asset';

export default function AssetDialog({
  open,
  onClose,
  asset,
}: {
  open: boolean;
  onClose: () => void;
  asset?: Asset;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {asset ? 'Edit Asset' : 'New Asset'}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <AssetForm onClose={onClose} asset={asset} />
      </DialogContent>
    </Dialog>
  );
}
