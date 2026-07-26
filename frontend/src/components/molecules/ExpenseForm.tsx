import { AppContext } from '@/context/AppContext';
import { formatMoney } from '@/utils/money';
import { currentTimestampForInput } from '@/utils/date-functions';
import { HttpClient } from '@/utils/httpClient';
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
} from '@mui/material';
import { use, useState } from 'react';
import ChipSelectMultiple from '@/components/atoms/ChipSelectMultiple';
import { useFormSubmit } from '@/hooks/useFormSubmit';

type ExpenseFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
  tags: string[];
  notes: string;
  bucket?: string;
};

const initialFormData: ExpenseFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
  tags: [],
  notes: '',
  bucket: '',
};

export default function ExpenseForm() {
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchExpenses,
    fetchFundSources,
    selectedExpense,
    setExpenseFormOpen,
    formAction,
    fundSources,
    tags,
    budgetEnabled,
    budgetFramework,
    buckets,
    fetchBudget,
  } = use(AppContext);
  const [formData, setFormData] = useState<ExpenseFormDataType>(
    formAction == 'update'
      ? { ...selectedExpense!, bucket: selectedExpense!.bucket ?? '' }
      : { ...initialFormData, timestamp: currentTimestampForInput() }
  );

  const onChangeHandler = (event: any, field: string) => {
    let value = event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(event.target.value);
      if (isNaN(value)) value = '';
    }
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        [field]: value,
      };
    });
  };

  const { submitting, handleSubmit } = useFormSubmit(async () => {
    if (budgetEnabled && !formData.bucket) {
      showErrorSnackBar(
        `Select a ${(budgetFramework?.bucketLabel ?? 'bucket').toLowerCase()} for this expense.`
      );
      return;
    }
    // Only send a bucket while a framework is active.
    const payload = budgetEnabled ? formData : { ...formData, bucket: undefined };
    try {
      if (formAction === 'update') {
        await HttpClient.patch(
          '/expenses?timestamp=' + selectedExpense?.timestamp,
          payload
        );
        showSuccessSnackBar('Expense updated successfully!');
      } else if (formAction === 'create') {
        await HttpClient.post('/expenses', payload);
        showSuccessSnackBar('Expense added successfully!');
      }
      setExpenseFormOpen(false);
      setFormData({
        ...initialFormData,
        timestamp: currentTimestampForInput(),
      });
      fetchExpenses();
      fetchFundSources();
      if (budgetEnabled) fetchBudget();
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to add expense.');
    }
  });

  const setSelectedTags = (tags: string[]) => {
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        tags: tags,
      };
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ pt: 1 }}>
        <FormControl sx={{ mb: 2.5, width: '100%' }} size="small">
          <InputLabel id="fund-source-label">Fund Source</InputLabel>
          <Select
            required
            labelId="fund-source-label"
            id="fund-source-select-helper"
            value={formData.fundSource}
            label="Fund Source"
            onChange={(event) => onChangeHandler(event, 'fundSource')}
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
          <FormControl sx={{ mb: 2.5, width: '100%' }} size="small">
            <InputLabel id="expense-bucket-label">
              {budgetFramework?.bucketLabel ?? 'Bucket'}
            </InputLabel>
            <Select
              required
              labelId="expense-bucket-label"
              value={formData.bucket ?? ''}
              label={budgetFramework?.bucketLabel ?? 'Bucket'}
              onChange={(event) => onChangeHandler(event, 'bucket')}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.key} value={bucket.key}>
                  {bucket.displayLabel} ({formatMoney(bucket.balance)} left)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
            disabled={submitting || (budgetEnabled && !formData.bucket)}
            sx={{ minWidth: 100 }}
          >
            {formAction === 'create' ? 'Add' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
