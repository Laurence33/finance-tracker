import { AppContext } from '@/context/AppContext';
import { currentTimestampForInput } from '@/utils/date-functions';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  Divider,
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
import {
  computeAllocations,
  sumAllocations,
  allocationsMatchAmount,
} from '@/utils/budget-helpers';

type IncomeFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
  source: string;
  tags: string[];
  notes: string;
  allocations?: Record<string, number>;
};

const initialFormData: IncomeFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
  source: '',
  tags: [],
  notes: '',
  allocations: {},
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
    budgetEnabled,
    budgetFramework,
    buckets,
    fetchBudget,
  } = use(AppContext);

  const [formData, setFormData] = useState<IncomeFormDataType>(() => {
    if (incomeFormAction === 'update') {
      const existing = selectedIncome!;
      // Seed allocations: keep the income's saved split, else derive from amount.
      const allocations =
        existing.allocations && Object.keys(existing.allocations).length > 0
          ? existing.allocations
          : budgetEnabled
            ? computeAllocations(existing.amount, buckets)
            : {};
      return { ...existing, allocations };
    }
    return { ...initialFormData, timestamp: currentTimestampForInput(), allocations: {} };
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const allocations = formData.allocations ?? {};
  const allocationTotal = sumAllocations(allocations);
  const allocationsValid = allocationsMatchAmount(allocations, Number(formData.amount) || 0);

  const onChangeHandler = (event: any, field: string) => {
    let value = event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(event.target.value);
      if (isNaN(value)) value = '';
    }
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Re-derive the bucket split whenever the amount changes (still editable after).
      if (field === 'amount' && budgetEnabled) {
        next.allocations = computeAllocations(Number(value) || 0, buckets);
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onAllocationChange = (key: string, raw: string) => {
    const num = parseFloat(raw);
    setFormData((prev) => ({
      ...prev,
      allocations: { ...(prev.allocations ?? {}), [key]: isNaN(num) ? 0 : num },
    }));
  };

  const { submitting, handleSubmit } = useFormSubmit(async () => {
    setFieldErrors({});
    if (budgetEnabled && !allocationsValid) {
      showErrorSnackBar('Allocations must add up to the income amount.');
      return;
    }
    // Only send allocations while a framework is active.
    const payload = budgetEnabled ? formData : { ...formData, allocations: undefined };
    try {
      if (incomeFormAction === 'update') {
        await HttpClient.patch(
          '/incomes?timestamp=' + selectedIncome?.timestamp,
          payload
        );
        showSuccessSnackBar('Income updated successfully!');
      } else {
        await HttpClient.post('/incomes', payload);
        showSuccessSnackBar('Income added successfully!');
      }
      setIncomeFormOpen(false);
      setFormData({
        ...initialFormData,
        timestamp: currentTimestampForInput(),
      });
      fetchIncomes();
      fetchFundSources();
      if (budgetEnabled) fetchBudget();
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

        {budgetEnabled && buckets.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Allocate to {budgetFramework?.bucketLabelPlural ?? 'Buckets'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pre-filled by target %, adjust as needed.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              {buckets.map((bucket) => (
                <TextField
                  key={bucket.key}
                  size="small"
                  type="number"
                  label={`${bucket.displayLabel} (${bucket.percentage}%)`}
                  value={allocations[bucket.key] ?? 0}
                  onChange={(event) => onAllocationChange(bucket.key, event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">₱</InputAdornment>
                      ),
                    },
                  }}
                />
              ))}
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 1.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                Allocated
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600 }}
                color={allocationsValid ? 'text.primary' : 'error'}
              >
                ₱{allocationTotal.toLocaleString()} / ₱
                {(Number(formData.amount) || 0).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
        )}
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
            disabled={submitting || (budgetEnabled && !allocationsValid)}
            sx={{ minWidth: 100 }}
          >
            {incomeFormAction === 'create' ? 'Add' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
