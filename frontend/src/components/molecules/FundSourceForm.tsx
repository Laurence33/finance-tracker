import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { use, useState } from 'react';
import { FundSource } from '@/types/FundSource';
import { useFormSubmit } from '@/hooks/useFormSubmit';

type FundSourceFormData = {
  name: string;
  balance: number;
  displayText: string;
  isCreditCard: boolean;
};

const initialFormData: FundSourceFormData = {
  name: '',
  balance: 0,
  displayText: '',
  isCreditCard: false,
};

type FieldErrors = Record<string, string[]>;

export default function FundSourceForm({
  onClose,
  fundSource,
}: {
  onClose: () => void;
  fundSource?: FundSource;
}) {
  const isEdit = !!fundSource;
  const { showErrorSnackBar, showSuccessSnackBar, fetchFundSources } =
    use(AppContext);
  const [formData, setFormData] = useState<FundSourceFormData>(
    isEdit ? fundSource : initialFormData,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onChangeHandler = (event: any, field: string) => {
    let value = event.target.value;
    if (field === 'balance') {
      value = parseFloat(value);
      if (isNaN(value)) value = 0;
    }
    if (field === 'name') {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const { submitting, handleSubmit } = useFormSubmit(async () => {
    setFieldErrors({});
    try {
      if (isEdit) {
        await HttpClient.patch(`/fund-sources/${fundSource.name}`, {
          balance: formData.balance,
          displayText: formData.displayText,
          isCreditCard: formData.isCreditCard,
        });
        showSuccessSnackBar('Fund source updated successfully!');
      } else {
        await HttpClient.post('/fund-sources', formData);
        showSuccessSnackBar('Fund source created successfully!');
      }
      setFormData(initialFormData);
      fetchFundSources();
      onClose();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to save fund source.');
      }
    }
  });

  const getError = (field: string) => fieldErrors[field]?.join(', ') || '';

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ pt: 1 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Display Name"
            variant="outlined"
            value={formData.displayText}
            onChange={(e) => onChangeHandler(e, 'displayText')}
            placeholder="e.g. BDO Savings"
            error={!!fieldErrors.displayText}
            helperText={getError('displayText')}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Identifier"
            variant="outlined"
            value={formData.name}
            onChange={(e) => onChangeHandler(e, 'name')}
            placeholder="e.g. bdo-savings"
            error={!!fieldErrors.name}
            helperText={getError('name') || 'Lowercase letters, numbers, and dashes only'}
            disabled={isEdit}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label={isEdit ? 'Balance' : 'Initial Balance'}
            variant="outlined"
            type="number"
            value={formData.balance}
            onChange={(e) => onChangeHandler(e, 'balance')}
            error={!!fieldErrors.balance}
            helperText={getError('balance')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
              htmlInput: formData.isCreditCard ? {} : { min: 0 },
            }}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isCreditCard}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isCreditCard: e.target.checked,
                  }))
                }
              />
            }
            label="Credit card (balance can go negative)"
          />
        </Box>
        <Stack direction="row" justifyContent="end" sx={{ mt: 1, mb: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={submitting}
            sx={{ minWidth: 100 }}
          >
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
