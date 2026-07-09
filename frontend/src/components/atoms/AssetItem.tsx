import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { MdEdit, MdDelete } from 'react-icons/md';
import { use } from 'react';
import { Asset } from '@/types/Asset';
import { AppContext } from '@/context/AppContext';

export default function AssetItem({
  asset,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  const { fundSources } = use(AppContext);
  const fundSourceLabel = asset.fundSource
    ? fundSources.find((fs) => fs.name === asset.fundSource)?.displayText ??
      asset.fundSource
    : '';

  return (
    <Card
      sx={{
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: 'text.primary' }}
                noWrap
              >
                {asset.name}
              </Typography>
              {asset.category && (
                <Chip
                  label={asset.category}
                  size="small"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                />
              )}
            </Stack>
            {asset.notes && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {asset.notes}
              </Typography>
            )}
            {fundSourceLabel && (
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', display: 'block' }}
                noWrap
              >
                Funded from {fundSourceLabel}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              ₱{asset.value.toLocaleString()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={() => onEdit(asset)}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MdEdit fontSize="1.1rem" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(asset)}
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
  );
}
