import { use, useState } from 'react';
import { Container, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AppContext } from '@/context/AppContext';
import { Tags } from '@/types/Tags';
import TagsList from '@/components/molecules/TagsList';
import TagDialog from '@/components/organisms/TagDialog';

export default function TagsPage() {
  const { tags } = use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tags | undefined>();

  const handleCreate = () => {
    setEditingTag(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (tag: Tags) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTag(undefined);
  };

  return (
    <>
      <TagDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        tag={editingTag}
      />

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
        >
          Tags ({tags.length})
        </Typography>

        <TagsList tags={tags} onEdit={handleEdit} />
      </Container>

      <Fab
        color="primary"
        aria-label="add tag"
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
