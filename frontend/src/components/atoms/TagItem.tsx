import { use, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { MdEdit, MdDelete } from 'react-icons/md';
import { Tags } from '@/types/Tags';
import { HttpClient } from '@/utils/httpClient';
import { AppContext } from '@/context/AppContext';

export default function TagItem({
  tag,
  onEdit,
}: {
  tag: Tags;
  onEdit: (tag: Tags) => void;
}) {
  const { fetchTags, showSuccessSnackBar, showErrorSnackBar } = use(AppContext);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await HttpClient.delete(`/tags/${tag.name}`);
      showSuccessSnackBar('Tag deleted successfully');
      fetchTags();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteOpen(false);
  };

  return (
    <>
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete tag?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{tag.name}</strong>? Existing
            expenses with this tag will not be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Card
        sx={{
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.selected',
                flexShrink: 0,
              }}
            >
              <LocalOfferIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}
            >
              {tag.name}
            </Typography>
            <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => onEdit(tag)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <MdEdit fontSize="1.1rem" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteOpen(true)}
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
    </>
  );
}
