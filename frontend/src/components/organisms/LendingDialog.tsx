import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LendingForm from '../molecules/LendingForm';
import { Lending } from '@/types/Lending';

export default function LendingDialog({
  open,
  onClose,
  lending,
}: {
  open: boolean;
  onClose: () => void;
  lending?: Lending;
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
            {lending ? 'Edit Lending' : 'New Lending'}
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
        <LendingForm onClose={onClose} lending={lending} />
      </DialogContent>
    </Dialog>
  );
}
