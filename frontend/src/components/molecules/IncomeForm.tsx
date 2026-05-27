import { AppContext } from '@/context/AppContext';
import { currentTimestampForInput } from '@/utils/date-functions';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  InputAdornment,
  Typography,
} from '@mui/material';
import { use, useState } from 'react';
import ChipSelectMultiple from '@/components/atoms/ChipSelectMultiple';
import { useFormSubmit } from '@/hooks/useFormSubmit';

type IncomeFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
  source: string;
  tags: string[];
  notes: string;
};

const initialFormData: IncomeFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
  source: '',
  tags: [],
  notes: '',
};

type FieldErrors = Record<string, string[]>;

export default function IncomeForm() {
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchIncomes,
    fetchFundSources,
    selectedIncome,
    setIncomeFormOpen,
    incomeFormAction,
    fundSources,
    tags,
  } = use(AppContext);

  const [formData, setFormData] = useState<IncomeFormDataType>(
    incomeFormAction === 'update'
      ? selectedIncome!
      : { ...initialFormData, timestamp: currentTimestampForInput() }
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onChangeHandler = (event: any, field: string) => {
    let value = event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(event.target.value);
      if (isNaN(value)) value = '';
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
      if (incomeFormAction === 'update') {
        await HttpClient.patch(
          '/incomes?timestamp=' + selectedIncome?.timestamp,
          formData
        );
        showSuccessSnackBar('Income updated successfully!');
      } else {
        await HttpClient.post('/incomes', formData);
        showSuccessSnackBar('Income added successfully!');
      }
      setIncomeFormOpen(false);
      setFormData({
        ...initialFormData,
        timestamp: currentTimestampForInput(),
      });
      fetchIncomes();
      fetchFundSources();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to save income.');
      }
    }
  });

  const setSelectedTags = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const getError = (field: string) => fieldErrors[field]?.join(', ') || '';

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ pt: 1 }}>
        <FormControl sx={{ mb: 2.5, width: '100%' }} size="small">
          <InputLabel id="income-fund-source-label">Fund Source</InputLabel>
          <Select
            required
            labelId="income-fund-source-label"
            value={formData.fundSource}
            label="Fund Source"
            onChange={(event) => onChangeHandler(event, 'fundSource')}
            error={!!fieldErrors.fundSource}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {fundSources.map((fundSource) => (
              <MenuItem key={fundSource.name} value={fundSource.name}>
                {fundSource.displayText}
              </MenuItem>
            ))}
          </Select>
          {getError('fundSource') && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
              {getError('fundSource')}
            </Typography>
          )}
        </FormControl>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Amount"
            variant="outlined"
            type="number"
            value={formData.amount}
            onChange={(event) => onChangeHandler(event, 'amount')}
            error={!!fieldErrors.amount}
            helperText={getError('amount')}
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
            required
            size="small"
            label="Source"
            variant="outlined"
            value={formData.source}
            onChange={(event) => onChangeHandler(event, 'source')}
            placeholder="e.g. Company XYZ, Freelance"
            error={!!fieldErrors.source}
            helperText={getError('source') || 'Where the income came from'}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            required
            size="small"
            label="Timestamp"
            variant="outlined"
            type="datetime-local"
            fullWidth
            value={formData.timestamp}
            onChange={(event) => onChangeHandler(event, 'timestamp')}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <ChipSelectMultiple
            label="Tags"
            required={true}
            list={tags.map((tag) => tag.name)}
            setSelectedItems={setSelectedTags}
            selectedItems={formData.tags}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Notes"
            variant="outlined"
            multiline
            minRows={2}
            value={formData.notes || ''}
            onChange={(event) => onChangeHandler(event, 'notes')}
            placeholder="Optional notes..."
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
            {incomeFormAction === 'create' ? 'Add' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
