import { use, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import { currentTimestampForInput } from '@/utils/date-functions';

type TransferFormData = {
  sourceFundSource: string;
  destinationFundSource: string;
  amount: number;
  fee: number;
  timestamp: string;
  note: string;
};

const initialFormData: TransferFormData = {
  sourceFundSource: '',
  destinationFundSource: '',
  amount: 0,
  fee: 0,
  timestamp: currentTimestampForInput(),
  note: '',
};

export default function TransferForm({ onClose }: { onClose: () => void }) {
  const {
    fundSources,
    fetchFundSources,
    fetchExpenses,
    fetchTags,
    showSuccessSnackBar,
    showErrorSnackBar,
  } = use(AppContext);

  const [formData, setFormData] = useState<TransferFormData>({
    ...initialFormData,
    timestamp: currentTimestampForInput(),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const sourceFund = fundSources.find((fs) => fs.name === formData.sourceFundSource);
  const sourceBalance = sourceFund?.balance ?? 0;
  const totalDeducted = (formData.amount || 0) + (formData.fee || 0);
  const insufficient =
    !!formData.sourceFundSource && totalDeducted > sourceBalance;

  const destinationOptions = fundSources.filter(
    (fs) => fs.name !== formData.sourceFundSource,
  );

  const setField = <K extends keyof TransferFormData>(
    key: K,
    value: TransferFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (formData.sourceFundSource === formData.destinationFundSource) {
      setFieldErrors({
        destinationFundSource: 'Source and destination must differ.',
      });
      return;
    }
    if (insufficient) {
      setFieldErrors({ amount: 'Insufficient source fund balance.' });
      return;
    }

    setSubmitting(true);
    try {
      await HttpClient.post('/transfers', formData);
      showSuccessSnackBar('Transfer completed successfully!');
      fetchFundSources();
      fetchExpenses();
      if (formData.fee > 0) fetchTags();
      onClose();
    } catch (error: any) {
      if (
        error instanceof HttpError &&
        Object.keys(error.fieldErrors).length > 0
      ) {
        const flattened: Record<string, string> = {};
        for (const [k, v] of Object.entries(error.fieldErrors)) {
          flattened[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
        setFieldErrors(flattened);
      } else {
        showErrorSnackBar(error.message || 'Failed to complete transfer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <Box sx={{ pt: 1 }}>
        <FormControl
          sx={{ mb: 2.5, width: '100%' }}
          size="small"
          error={!!fieldErrors.sourceFundSource}
        >
          <InputLabel id="source-fund-label">From</InputLabel>
          <Select
            required
            labelId="source-fund-label"
            value={formData.sourceFundSource}
            label="From"
            onChange={(e) => setField('sourceFundSource', e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {fundSources.map((fundSource) => (
              <MenuItem key={fundSource.name} value={fundSource.name}>
                {fundSource.displayText} (₱{fundSource.balance.toLocaleString()})
              </MenuItem>
            ))}
          </Select>
          {fieldErrors.sourceFundSource && (
            <FormHelperText>{fieldErrors.sourceFundSource}</FormHelperText>
          )}
        </FormControl>

        <FormControl
          sx={{ mb: 2.5, width: '100%' }}
          size="small"
          error={!!fieldErrors.destinationFundSource}
        >
          <InputLabel id="dest-fund-label">To</InputLabel>
          <Select
            required
            labelId="dest-fund-label"
            value={formData.destinationFundSource}
            label="To"
            onChange={(e) => setField('destinationFundSource', e.target.value)}
            disabled={!formData.sourceFundSource}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {destinationOptions.map((fundSource) => (
              <MenuItem key={fundSource.name} value={fundSource.name}>
                {fundSource.displayText}
              </MenuItem>
            ))}
          </Select>
          {fieldErrors.destinationFundSource && (
            <FormHelperText>{fieldErrors.destinationFundSource}</FormHelperText>
          )}
        </FormControl>

        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setField('amount', parseFloat(e.target.value) || 0)}
            error={!!fieldErrors.amount || insufficient}
            helperText={
              fieldErrors.amount ||
              (insufficient
                ? `Exceeds available balance of ₱${sourceBalance.toLocaleString()}`
                : ' ')
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Fee (optional)"
            type="number"
            value={formData.fee}
            onChange={(e) => setField('fee', parseFloat(e.target.value) || 0)}
            error={!!fieldErrors.fee}
            helperText={
              fieldErrors.fee ||
              'Charged from the source fund as a "Transfer Fee" expense.'
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <TextField
            required
            fullWidth
            size="small"
            label="Timestamp"
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) => setField('timestamp', e.target.value)}
            error={!!fieldErrors.timestamp}
            helperText={fieldErrors.timestamp}
          />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Note"
            multiline
            minRows={2}
            value={formData.note}
            onChange={(e) => setField('note', e.target.value)}
            placeholder="Optional note..."
          />
        </Box>

        {sourceFund && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Available in {sourceFund.displayText}: ₱
            {sourceBalance.toLocaleString()}
          </Typography>
        )}

        <Stack direction="row" justifyContent="end" sx={{ mt: 2, mb: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={submitting || insufficient}
            sx={{ minWidth: 100 }}
          >
            {submitting ? 'Transferring…' : 'Transfer'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
