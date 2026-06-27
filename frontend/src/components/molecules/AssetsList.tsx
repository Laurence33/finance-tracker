import { Box, Stack, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Asset } from '@/types/Asset';
import AssetItem from '@/components/atoms/AssetItem';

export default function AssetsList({
  assets,
  onEdit,
  onDelete,
}: {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <AccountBalanceIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No assets
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to add a new asset
        </Typography>
      </Box>
    );
  }

  const sorted = [...assets].sort((a, b) => b.value - a.value);

  return (
    <Stack spacing={1.5}>
      {sorted.map((asset) => (
        <AssetItem
          key={asset.timestamp}
          asset={asset}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  );
}
