import { Box, Stack, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Asset } from '@/types/Asset';
import AssetItem from '@/components/atoms/AssetItem';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';

/**
 * `Asset.category` is a non-optional string, so "no category" arrives as `''`
 * (or whitespace from a form). Those assets get their own trailing group rather
 * than a group whose eyebrow renders blank — or worse, no group at all.
 */
const UNCATEGORISED = 'Uncategorised';

type AssetGroup = { label: string; total: number; assets: Asset[] };

function groupByCategory(assets: Asset[]): AssetGroup[] {
  const byCategory = new Map<string, Asset[]>();

  for (const asset of assets) {
    const label = asset.category?.trim() || UNCATEGORISED;
    const bucket = byCategory.get(label);
    if (bucket) bucket.push(asset);
    else byCategory.set(label, [asset]);
  }

  return [...byCategory.entries()]
    .map(([label, items]) => ({
      label,
      total: items.reduce((sum, asset) => sum + asset.value, 0),
      // The page has always shown the biggest holding first; grouping keeps that
      // sort inside each category instead of across the whole list.
      assets: [...items].sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => {
      // Uncategorised is a residue, not a category — last whatever it holds.
      if (a.label === UNCATEGORISED) return 1;
      if (b.label === UNCATEGORISED) return -1;
      // Categories are free text, so §2's "fixed domain order" has nothing to
      // key off. Biggest category first, name as a deterministic tiebreak so the
      // group order can never shuffle between renders.
      return b.total - a.total || a.label.localeCompare(b.label);
    });
}

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

  const groups = groupByCategory(assets);

  return (
    <Stack spacing={2}>
      {groups.map((group, index) => (
        <LedgerGroupCard
          key={group.label}
          label={group.label}
          count={group.assets.length}
          index={index}
        >
          {group.assets.map((asset) => (
            <AssetItem
              key={asset.timestamp}
              asset={asset}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </LedgerGroupCard>
      ))}
    </Stack>
  );
}
