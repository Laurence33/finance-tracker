import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  MenuItem,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { use, useState } from 'react';
import { Lending } from '@/types/Lending';

type PaymentFormData = {
  amount: number;
  fundSource: string;
  notes: string;
  addedToBalance: boolean;
};

type FieldErrors = Record<string, string[]>;

export default function LendingPaymentForm({
  onClose,
  lending,
}: {
  onClose: () => void;
  lending: Lending;
}) {
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchLendings,
    fetchFundSources,
    fundSources,
  } = use(AppContext);

  const remaining = lending.amount - lending.totalPaid;

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: remaining,
    fundSource: '',
    notes: '',
    addedToBalance: true,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onChangeHandler = (value: any, field: string) => {
    if (field === 'amount') {
      value = parseFloat(value);
      if (isNaN(value)) value = 0;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    try {
      await HttpClient.post('/lendings/payments', {
        lendingTimestamp: lending.timestamp,
        amount: formData.amount,
        fundSource: formData.fundSource,
        notes: formData.notes,
        addedToBalance: formData.addedToBalance,
      });
      showSuccessSnackBar('Payment recorded successfully!');
      fetchLendings();
      fetchFundSources();
      onClose();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to record payment.');
      }
    }
  };

  const getError = (field: string) => fieldErrors[field]?.join(', ') || '';

  return (
    <form onSubmit={submitHandler}>
      <Box sx={{ pt: 1 }}>
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Lending to <strong>{lending.borrower}</strong> · Remaining: <strong>₱{remaining.toLocaleString()}</strong>
          </Typography>
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Payment Amount"
            variant="outlined"
            type="number"
            value={formData.amount || ''}
            onChange={(e) => onChangeHandler(e.target.value, 'amount')}
            error={!!fieldErrors.amount}
            helperText={getError('amount') || `Max: ₱${remaining.toLocaleString()}`}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
              htmlInput: { min: 0, max: remaining, step: 'any' },
            }}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            select
            size="small"
            label="Receive Into"
            variant="outlined"
            value={formData.fundSource}
            onChange={(e) => onChangeHandler(e.target.value, 'fundSource')}
            error={!!fieldErrors.fundSource}
            helperText={
              getError('fundSource') ||
              (formData.addedToBalance
                ? 'Balance will be added to this source'
                : 'Recorded for reference only — balance unchanged')
            }
          >
            {fundSources.map((fs) => (
              <MenuItem key={fs.name} value={fs.name}>
                {fs.displayText} (₱{fs.balance.toLocaleString()})
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            sx={{ mt: 0.5, ml: 0 }}
            control={
              <Checkbox
                size="small"
                checked={formData.addedToBalance}
                onChange={(e) =>
                  onChangeHandler(e.target.checked, 'addedToBalance')
                }
              />
            }
            label="Add to fund source balance"
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Notes"
            variant="outlined"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => onChangeHandler(e.target.value, 'notes')}
            placeholder="Optional notes"
          />
        </Box>
        <Stack direction="row" justifyContent="end" sx={{ mt: 1, mb: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            sx={{ minWidth: 100 }}
          >
            Record Payment
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
