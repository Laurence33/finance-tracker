import { Tags } from '@/types/Tags';
import { Box, Stack, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TagItem from '../atoms/TagItem';

export default function TagsList({
  tags,
  onEdit,
}: {
  tags: Tags[];
  onEdit: (tag: Tags) => void;
}) {
  if (tags.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LocalOfferIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No tags yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to create your first tag
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {tags.map((tag) => (
        <TagItem key={tag.name} tag={tag} onEdit={onEdit} />
      ))}
    </Stack>
  );
}
