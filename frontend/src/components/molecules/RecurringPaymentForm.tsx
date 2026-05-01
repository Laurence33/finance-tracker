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
} from '@mui/material';
import { use, useState } from 'react';
import { RecurringExpense } from '@/types/RecurringExpense';
import { getAmountDisplay, getCurrentPeriodKey, getPeriodLabel } from '@/utils/recurring-helpers';

type PaymentFormData = {
  periodKey: string;
  amount: number;
  fundSource: string;
  notes: string;
};

type FieldErrors = Record<string, string[]>;

export default function RecurringPaymentForm({
  onClose,
  recurringExpense,
}: {
  onClose: () => void;
  recurringExpense: RecurringExpense;
}) {
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchRecurringExpenses,
    fetchFundSources,
    fetchExpenses,
    fundSources,
  } = use(AppContext);

  const currentPeriodKey = getCurrentPeriodKey(recurringExpense.frequency, recurringExpense.startDate);
  const isAsNeeded = recurringExpense.frequency === 'as_needed';

  const [formData, setFormData] = useState<PaymentFormData>({
    periodKey: currentPeriodKey,
    amount: recurringExpense.amountType === 'fixed' ? recurringExpense.amount : 0,
    fundSource: '',
    notes: '',
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
      // Always regenerate periodKey for as_needed so each payment is unique
      const periodKey = isAsNeeded
        ? getCurrentPeriodKey(recurringExpense.frequency, recurringExpense.startDate)
        : formData.periodKey;
      await HttpClient.post(
        `/recurring-expenses/${encodeURIComponent(recurringExpense.name)}/pay`,
        { ...formData, periodKey },
      );
      showSuccessSnackBar('Payment recorded successfully!');
      fetchRecurringExpenses();
      fetchFundSources();
      fetchExpenses();
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
            <strong>{recurringExpense.displayName}</strong> · {getAmountDisplay(recurringExpense)}
          </Typography>
        </Box>
        {!isAsNeeded && (
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Period"
              variant="outlined"
              value={formData.periodKey}
              onChange={(e) => onChangeHandler(e.target.value, 'periodKey')}
              error={!!fieldErrors.periodKey}
              helperText={getError('periodKey') || `Current: ${getPeriodLabel(recurringExpense.frequency, currentPeriodKey)}`}
            />
          </Box>
        )}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Amount"
            variant="outlined"
            type="number"
            value={formData.amount || ''}
            onChange={(e) => onChangeHandler(e.target.value, 'amount')}
            error={!!fieldErrors.amount}
            helperText={getError('amount')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              },
              htmlInput: { min: 0, step: 'any' },
            }}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            select
            size="small"
            label="Fund Source"
            variant="outlined"
            value={formData.fundSource}
            onChange={(e) => onChangeHandler(e.target.value, 'fundSource')}
            error={!!fieldErrors.fundSource}
            helperText={getError('fundSource') || 'Balance will be deducted from this source'}
          >
            {fundSources.map((fs) => (
              <MenuItem key={fs.name} value={fs.name}>
                {fs.displayText} (₱{fs.balance.toLocaleString()})
              </MenuItem>
            ))}
          </TextField>
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
            Pay
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
