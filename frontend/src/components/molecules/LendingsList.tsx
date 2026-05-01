import { Box, Stack, Typography } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { Lending } from '@/types/Lending';
import LendingItem from '@/components/atoms/LendingItem';

function sortLendings(lendings: Lending[]): Lending[] {
  const priority: Record<string, number> = {
    overdue: 0,
    active: 1,
    partially_paid: 2,
    paid: 3,
  };

  return [...lendings].sort((a, b) => {
    const aOverdue = a.status !== 'paid' && new Date(a.promisedDate) < new Date(new Date().toDateString());
    const bOverdue = b.status !== 'paid' && new Date(b.promisedDate) < new Date(new Date().toDateString());

    const aKey = aOverdue ? 'overdue' : a.status;
    const bKey = bOverdue ? 'overdue' : b.status;

    return (priority[aKey] ?? 4) - (priority[bKey] ?? 4);
  });
}

export default function LendingsList({
  lendings,
  onEdit,
  onDelete,
  onPay,
  onTap,
}: {
  lendings: Lending[];
  onEdit: (lending: Lending) => void;
  onDelete: (lending: Lending) => void;
  onPay: (lending: Lending) => void;
  onTap: (lending: Lending) => void;
}) {
  if (lendings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <HandshakeIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No lendings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to record a new lending
        </Typography>
      </Box>
    );
  }

  const sorted = sortLendings(lendings);

  return (
    <Stack spacing={1.5}>
      {sorted.map((lending) => (
        <LendingItem
          key={lending.timestamp}
          lending={lending}
          onEdit={onEdit}
          onDelete={onDelete}
          onPay={onPay}
          onTap={onTap}
        />
      ))}
    </Stack>
  );
}
