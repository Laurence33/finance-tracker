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
import { RecurringExpense, RecurringExpensePayment } from '@/types/RecurringExpense';
import { HttpClient } from '@/utils/httpClient';
import {
  getAmountDisplay,
  getCurrentPeriodKey,
  getFrequencyLabel,
  getPeriodLabel,
} from '@/utils/recurring-helpers';
import RecurringPaymentsList from '../molecules/RecurringPaymentsList';

export default function RecurringExpenseDetailDialog({
  open,
  onClose,
  recurringExpense,
  onPay,
  onUpdateStatus,
}: {
  open: boolean;
  onClose: () => void;
  recurringExpense: RecurringExpense | null;
  onPay: (re: RecurringExpense) => void;
  onUpdateStatus: (re: RecurringExpense, status: string) => void;
}) {
  const [payments, setPayments] = useState<RecurringExpensePayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && recurringExpense) {
      fetchPayments();
    } else {
      setPayments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recurringExpense]);

  const fetchPayments = async () => {
    if (!recurringExpense) return;
    setLoading(true);
    try {
      const response = await HttpClient.get<any>(
        `/recurring-expenses/${encodeURIComponent(recurringExpense.name)}/payments`,
      );
      if (response && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  if (!recurringExpense) return null;

  const isAsNeeded = recurringExpense.frequency === 'as_needed';
  const currentPeriodKey = getCurrentPeriodKey(recurringExpense.frequency, recurringExpense.startDate);
  const currentPeriodPaid = !isAsNeeded && payments.some((p) => p.periodKey === currentPeriodKey);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Recurring Details</Typography>
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
                Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {recurringExpense.displayName}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Amount
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {getAmountDisplay(recurringExpense)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Frequency
              </Typography>
              <Typography variant="body2">
                {getFrequencyLabel(recurringExpense.frequency)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Status
              </Typography>
              <Chip
                label={recurringExpense.status}
                color={recurringExpense.status === 'active' ? 'success' : recurringExpense.status === 'cancelled' ? 'error' : 'default'}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Stack>
            {!isAsNeeded && recurringExpense.startDate && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Start Date
                </Typography>
                <Typography variant="body2">
                  {new Date(recurringExpense.startDate).toLocaleDateString()}
                </Typography>
              </Stack>
            )}
            {!isAsNeeded && recurringExpense.endDate && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  End Date
                </Typography>
                <Typography variant="body2">
                  {new Date(recurringExpense.endDate).toLocaleDateString()}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tags
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {recurringExpense.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                ))}
              </Stack>
            </Stack>
            {recurringExpense.notes && (
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', maxWidth: '60%' }}>
                  {recurringExpense.notes}
                </Typography>
              </Stack>
            )}
          </Stack>

          {recurringExpense.status === 'active' && !isAsNeeded && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: currentPeriodPaid ? 'success.main' : 'warning.main',
                color: 'white',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getPeriodLabel(recurringExpense.frequency, currentPeriodKey)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {currentPeriodPaid ? 'Paid' : 'Due'}
                  </Typography>
                </Box>
                {!currentPeriodPaid && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onPay(recurringExpense)}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    }}
                  >
                    Pay Now
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          {recurringExpense.status === 'active' && isAsNeeded && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => onPay(recurringExpense)}
              >
                Record Payment
              </Button>
            </Box>
          )}

          {recurringExpense.status === 'active' && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={() => onUpdateStatus(recurringExpense, 'completed')}
              >
                Mark Completed
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => onUpdateStatus(recurringExpense, 'cancelled')}
              >
                Cancel
              </Button>
            </Stack>
          )}
          {(recurringExpense.status === 'completed' || recurringExpense.status === 'cancelled') && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => onUpdateStatus(recurringExpense, 'active')}
              >
                Reactivate
              </Button>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Payment History ({payments.length})
          </Typography>

          {loading ? (
            <LinearProgress sx={{ mb: 2 }} />
          ) : (
            <RecurringPaymentsList payments={payments} frequency={recurringExpense.frequency} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
