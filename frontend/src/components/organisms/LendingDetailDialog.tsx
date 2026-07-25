import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import { Lending, LendingPayment } from '@/types/Lending';
import { HttpClient } from '@/utils/httpClient';
import {
  getLendingRemaining,
  isLendingOverdue,
} from '@/utils/lending-helpers';
import Money from '@/components/atoms/Money';
import LendingPaymentsList from '../molecules/LendingPaymentsList';

/**
 * The detail view, and the only home for this record's actions. Pay, edit and
 * delete moved off the list row into this dialog's title bar (§2, "Row
 * actions") because three icons cost ~83px of the row's ~326px budget.
 *
 * Every handler here is expected to close this dialog before opening its own —
 * see `handlePayFromDetail` and friends in `pages/lendings.tsx`.
 */
export default function LendingDetailDialog({
  open,
  onClose,
  lending,
  onPay,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  lending: Lending | null;
  onPay: (lending: Lending) => void;
  onEdit: (lending: Lending) => void;
  onDelete: (lending: Lending) => void;
}) {
  const [payments, setPayments] = useState<LendingPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && lending) {
      fetchPayments();
    } else {
      setPayments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lending]);

  const fetchPayments = async () => {
    if (!lending) return;
    setLoading(true);
    try {
      const response = await HttpClient.get<any>(
        `/lendings/payments?lendingTimestamp=${encodeURIComponent(lending.timestamp)}`,
      );
      if (response && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  if (!lending) return null;

  const remaining = getLendingRemaining(lending);
  const progress = lending.amount > 0 ? (lending.totalPaid / lending.amount) * 100 : 0;
  const settled = lending.status === 'paid';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Lending Details</Typography>
          <Stack direction="row" spacing={0.5}>
            {!settled && (
              <IconButton
                size="small"
                onClick={() => onPay(lending)}
                aria-label="Record payment"
                sx={{ color: 'text.secondary', '&:hover': { color: 'success.main' } }}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => onEdit(lending)}
              aria-label="Edit lending"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(lending)}
              aria-label="Delete lending"
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Borrower
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {lending.borrower}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Amount
              </Typography>
              <Money
                variant="body1"
                amount={lending.amount}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Remaining
              </Typography>
              <Money
                variant="body1"
                amount={remaining}
                sx={{
                  fontWeight: 600,
                  color: remaining > 0 ? 'warning.main' : 'success.main',
                }}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Fund Source
              </Typography>
              <Typography variant="body2">{lending.fundSource}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Due Date
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2">
                  {new Date(lending.promisedDate).toLocaleDateString()}
                </Typography>
                {isLendingOverdue(lending) && (
                  <Chip label="Overdue" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
              </Stack>
            </Stack>
            {lending.notes && (
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', maxWidth: '60%' }}>
                  {lending.notes}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Payment Progress
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {progress.toFixed(0)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Payment History
            </Typography>
            {!settled && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onPay(lending)}
              >
                Add Payment
              </Button>
            )}
          </Stack>

          {loading ? (
            <LinearProgress sx={{ mb: 2 }} />
          ) : (
            <LendingPaymentsList payments={payments} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
