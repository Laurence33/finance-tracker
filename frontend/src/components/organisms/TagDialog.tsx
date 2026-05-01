import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TagForm from '../molecules/TagForm';
import { Tags } from '@/types/Tags';

export default function TagDialog({
  open,
  onClose,
  tag,
}: {
  open: boolean;
  onClose: () => void;
  tag?: Tags;
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
            {tag ? 'Edit Tag' : 'New Tag'}
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
        <TagForm onClose={onClose} tag={tag} />
      </DialogContent>
    </Dialog>
  );
}
