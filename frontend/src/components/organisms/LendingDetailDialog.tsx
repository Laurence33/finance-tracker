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
import { Lending, LendingPayment } from '@/types/Lending';
import { HttpClient } from '@/utils/httpClient';
import LendingPaymentsList from '../molecules/LendingPaymentsList';

function isOverdue(lending: Lending): boolean {
  if (lending.status === 'paid') return false;
  return new Date(lending.promisedDate) < new Date(new Date().toDateString());
}

export default function LendingDetailDialog({
  open,
  onClose,
  lending,
  onAddPayment,
}: {
  open: boolean;
  onClose: () => void;
  lending: Lending | null;
  onAddPayment: (lending: Lending) => void;
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

  const remaining = lending.amount - lending.totalPaid;
  const progress = lending.amount > 0 ? (lending.totalPaid / lending.amount) * 100 : 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Lending Details</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
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
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ₱{lending.amount.toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Remaining
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: remaining > 0 ? 'warning.main' : 'success.main' }}>
                ₱{remaining.toLocaleString()}
              </Typography>
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
                {isOverdue(lending) && (
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
            {lending.status !== 'paid' && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAddPayment(lending)}
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
