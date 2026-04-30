import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FundSourceForm from '../molecules/FundSourceForm';
import { FundSource } from '@/types/FundSource';

export default function FundSourceDialog({
  open,
  onClose,
  fundSource,
}: {
  open: boolean;
  onClose: () => void;
  fundSource?: FundSource;
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
            {fundSource ? 'Edit Fund Source' : 'New Fund Source'}
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
        <FundSourceForm onClose={onClose} fundSource={fundSource} />
      </DialogContent>
    </Dialog>
  );
}
