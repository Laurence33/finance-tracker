import { Box, Stack, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { FundSource } from '@/types/FundSource';
import FundSourceItem from '@/components/atoms/FundSourceItem';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';

/**
 * `isCreditCard` is a boolean, so this is a **closed enum** and §2's fixed
 * domain order applies — cash first, cards second, always. The free-text rule
 * (order by aggregate descending) is for `Asset.category`-style values and would
 * make these two groups swap places as balances move.
 *
 * Cash first because it is the money the user actually holds; the hero's figure
 * measures exactly that group.
 */
const GROUPS: { key: string; label: string; isCreditCard: boolean }[] = [
  { key: 'cash', label: 'Cash accounts', isCreditCard: false },
  { key: 'credit', label: 'Credit cards', isCreditCard: true },
];

export default function FundSourceList({
  fundSources,
  onEdit,
  onDelete,
}: {
  fundSources: FundSource[];
  onEdit: (fundSource: FundSource) => void;
  onDelete: (fundSource: FundSource) => void;
}) {
  if (fundSources.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <AccountBalanceWalletIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No fund sources
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to add your first fund source
        </Typography>
      </Box>
    );
  }

  // A wallet with no credit card should not render an empty `Credit cards`
  // card — an empty group is a header that hoists nothing (§2).
  const groups = GROUPS.map((group) => ({
    ...group,
    // Source order preserved. Unlike the assets page, this list has never been
    // sorted by value, and re-sorting it here would hide the order the user
    // added their accounts in (§2).
    items: fundSources.filter((fs) => fs.isCreditCard === group.isCreditCard),
  })).filter((group) => group.items.length > 0);

  return (
    <Stack spacing={2}>
      {groups.map((group, index) => (
        <LedgerGroupCard
          key={group.key}
          label={group.label}
          count={group.items.length}
          index={index}
        >
          {group.items.map((fundSource) => (
            <FundSourceItem
              key={fundSource.name}
              fundSource={fundSource}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </LedgerGroupCard>
      ))}
    </Stack>
  );
}
