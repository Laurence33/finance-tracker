import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { MdEdit, MdDelete, MdPayment } from 'react-icons/md';
import { Lending } from '@/types/Lending';

function isOverdue(lending: Lending): boolean {
  if (lending.status === 'paid') return false;
  return new Date(lending.promisedDate) < new Date(new Date().toDateString());
}

function getStatusLabel(lending: Lending): string {
  if (isOverdue(lending)) return 'Overdue';
  if (lending.status === 'partially_paid') return 'Partial';
  if (lending.status === 'paid') return 'Paid';
  return 'Active';
}

function getStatusColor(lending: Lending): 'error' | 'warning' | 'success' | 'default' {
  if (isOverdue(lending)) return 'error';
  if (lending.status === 'partially_paid') return 'warning';
  if (lending.status === 'paid') return 'success';
  return 'default';
}

export default function LendingItem({
  lending,
  onEdit,
  onDelete,
  onPay,
  onTap,
}: {
  lending: Lending;
  onEdit: (lending: Lending) => void;
  onDelete: (lending: Lending) => void;
  onPay: (lending: Lending) => void;
  onTap: (lending: Lending) => void;
}) {
  return (
    <Card
      sx={{
        transition: 'box-shadow 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
      onClick={() => onTap(lending)}
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
                {lending.borrower}
              </Typography>
              <Chip
                label={getStatusLabel(lending)}
                color={getStatusColor(lending)}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Due: {new Date(lending.promisedDate).toLocaleDateString()} · {lending.fundSource}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              ₱{lending.amount.toLocaleString()}
            </Typography>
            {lending.totalPaid > 0 && (
              <Typography variant="caption" sx={{ color: 'success.main' }}>
                ₱{lending.totalPaid.toLocaleString()} paid
              </Typography>
            )}
          </Box>
          <Stack
            direction="row"
            spacing={0}
            sx={{ flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {lending.status !== 'paid' && (
              <IconButton
                size="small"
                onClick={() => onPay(lending)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'success.main' },
                }}
              >
                <MdPayment fontSize="1.1rem" />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => onEdit(lending)}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MdEdit fontSize="1.1rem" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(lending)}
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
