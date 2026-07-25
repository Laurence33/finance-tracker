import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TagForm from '../molecules/TagForm';
import { Tags } from '@/types/Tags';

export default function TagDialog({
  open,
  onClose,
  tag,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  tag?: Tags;
  /**
   * Delete lives here, in the title bar before `Close`, because the ledger row
   * gave up its icon rail — §2: when a row action moves into a dialog, that is
   * where it goes. Only offered when editing an existing tag.
   */
  onDelete?: (tag: Tags) => void;
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
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {tag && onDelete ? (
              <IconButton
                size="small"
                aria-label="delete tag"
                onClick={() => onDelete(tag)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main' },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ) : null}
            <IconButton
              size="small"
              aria-label="close"
              onClick={onClose}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TagForm onClose={onClose} tag={tag} />
      </DialogContent>
    </Dialog>
  );
}
