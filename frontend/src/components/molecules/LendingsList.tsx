import { Box, Stack, Typography } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { Lending } from '@/types/Lending';
import { LENDING_GROUPS, getLendingGroup } from '@/utils/lending-helpers';
import LendingItem from '@/components/atoms/LendingItem';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';

/**
 * The lendings ledger (§2 of `docs/ui-patterns.md`): one group card per status
 * in a fixed domain order, most actionable first.
 *
 * Status repeated on every row as a chip, which is what starved the borrower's
 * name; hoisting it into the group header is what bought that width back. Source
 * order is preserved inside each group — `filter` never reorders — so the order
 * the user created lendings in survives.
 */
export default function LendingsList({
  lendings,
  onTap,
}: {
  lendings: Lending[];
  onTap: (lending: Lending) => void;
}) {
  if (lendings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <HandshakeIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No lendings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to record a new lending
        </Typography>
      </Box>
    );
  }

  const groups = LENDING_GROUPS.map(({ group, heading }) => ({
    heading,
    items: lendings.filter((lending) => getLendingGroup(lending) === group),
  })).filter((group) => group.items.length > 0);

  return (
    <Stack spacing={2}>
      {groups.map((group, index) => (
        <LedgerGroupCard
          key={group.heading}
          label={group.heading}
          count={group.items.length}
          index={index}
        >
          {group.items.map((lending) => (
            <LendingItem
              key={lending.timestamp}
              lending={lending}
              onTap={onTap}
            />
          ))}
        </LedgerGroupCard>
      ))}
    </Stack>
  );
}
