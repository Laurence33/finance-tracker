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
import { RecurringExpense } from '@/types/RecurringExpense';
import { getAmountDisplay, getFrequencyLabel } from '@/utils/recurring-helpers';

function getStatusColor(status: string): 'success' | 'default' | 'error' {
  if (status === 'active') return 'success';
  if (status === 'cancelled') return 'error';
  return 'default';
}

export default function RecurringExpenseItem({
  recurringExpense,
  onEdit,
  onDelete,
  onTap,
}: {
  recurringExpense: RecurringExpense;
  onEdit: (re: RecurringExpense) => void;
  onDelete: (re: RecurringExpense) => void;
  onTap: (re: RecurringExpense) => void;
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
      onClick={() => onTap(recurringExpense)}
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
                {recurringExpense.displayName}
              </Typography>
              <Chip
                label={recurringExpense.status}
                color={getStatusColor(recurringExpense.status)}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {getFrequencyLabel(recurringExpense.frequency)} · {recurringExpense.tags.join(', ')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              {getAmountDisplay(recurringExpense)}
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={0}
            sx={{ flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              onClick={() => onEdit(recurringExpense)}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MdEdit fontSize="1.1rem" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(recurringExpense)}
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
