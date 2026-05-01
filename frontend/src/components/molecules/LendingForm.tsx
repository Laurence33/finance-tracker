import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Autocomplete,
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { use, useState } from 'react';
import { Lending } from '@/types/Lending';

type LendingFormData = {
  borrower: string;
  amount: number;
  fundSource: string;
  promisedDate: string;
  notes: string;
};

const initialFormData: LendingFormData = {
  borrower: '',
  amount: 0,
  fundSource: '',
  promisedDate: '',
  notes: '',
};

type FieldErrors = Record<string, string[]>;

export default function LendingForm({
  onClose,
  lending,
}: {
  onClose: () => void;
  lending?: Lending;
}) {
  const isEdit = !!lending;
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchLendings,
    fetchFundSources,
    fundSources,
    borrowers,
  } = use(AppContext);

  const [formData, setFormData] = useState<LendingFormData>(
    isEdit
      ? {
          borrower: lending.borrower,
          amount: lending.amount,
          fundSource: lending.fundSource,
          promisedDate: lending.promisedDate,
          notes: lending.notes,
        }
      : initialFormData,
  );
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
      if (isEdit) {
        await HttpClient.patch(`/lendings?timestamp=${encodeURIComponent(lending.timestamp)}`, {
          borrower: formData.borrower,
          amount: formData.amount,
          promisedDate: formData.promisedDate,
          notes: formData.notes,
        });
        showSuccessSnackBar('Lending updated successfully!');
      } else {
        await HttpClient.post('/lendings', formData);
        showSuccessSnackBar('Lending created successfully!');
      }
      setFormData(initialFormData);
      fetchLendings();
      fetchFundSources();
      onClose();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to save lending.');
      }
    }
  };

  const getError = (field: string) => fieldErrors[field]?.join(', ') || '';

  return (
    <form onSubmit={submitHandler}>
      <Box sx={{ pt: 1 }}>
        <Box sx={{ mb: 2.5 }}>
          <Autocomplete
            freeSolo
            options={borrowers}
            value={formData.borrower}
            onInputChange={(_, value) => onChangeHandler(value, 'borrower')}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                required
                size="small"
                label="Borrower"
                placeholder="e.g. Juan"
                error={!!fieldErrors.borrower}
                helperText={getError('borrower')}
              />
            )}
          />
        </Box>
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
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
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
            disabled={isEdit}
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
            required
            size="small"
            label="Promised Payment Date"
            variant="outlined"
            type="date"
            value={formData.promisedDate}
            onChange={(e) => onChangeHandler(e.target.value, 'promisedDate')}
            error={!!fieldErrors.promisedDate}
            helperText={getError('promisedDate')}
            slotProps={{
              inputLabel: { shrink: true },
            }}
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
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
