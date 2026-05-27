import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { use, useState } from 'react';
import { RecurringExpense } from '@/types/RecurringExpense';
import ChipSelectMultiple from '@/components/atoms/ChipSelectMultiple';
import { useFormSubmit } from '@/hooks/useFormSubmit';

type RecurringExpenseFormData = {
  name: string;
  displayName: string;
  amountType: 'fixed' | 'range';
  amount: number;
  amountMin: number;
  amountMax: number;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed';
  startDate: string;
  endDate: string;
  tags: string[];
  notes: string;
};

const initialFormData: RecurringExpenseFormData = {
  name: '',
  displayName: '',
  amountType: 'fixed',
  amount: 0,
  amountMin: 0,
  amountMax: 0,
  frequency: 'monthly',
  startDate: '',
  endDate: '',
  tags: [],
  notes: '',
};

type FieldErrors = Record<string, string[]>;

export default function RecurringExpenseForm({
  onClose,
  recurringExpense,
}: {
  onClose: () => void;
  recurringExpense?: RecurringExpense;
}) {
  const isEdit = !!recurringExpense;
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchRecurringExpenses,
    tags,
  } = use(AppContext);

  const [formData, setFormData] = useState<RecurringExpenseFormData>(
    isEdit
      ? {
          name: recurringExpense.name,
          displayName: recurringExpense.displayName,
          amountType: recurringExpense.amountType,
          amount: recurringExpense.amount,
          amountMin: recurringExpense.amountMin,
          amountMax: recurringExpense.amountMax,
          frequency: recurringExpense.frequency,
          startDate: recurringExpense.startDate,
          endDate: recurringExpense.endDate,
          tags: recurringExpense.tags,
          notes: recurringExpense.notes,
        }
      : initialFormData,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isAsNeeded = formData.frequency === 'as_needed';

  const onChangeHandler = (value: any, field: string) => {
    if (['amount', 'amountMin', 'amountMax'].includes(field)) {
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

  const { submitting, handleSubmit } = useFormSubmit(async () => {
    setFieldErrors({});
    try {
      if (isEdit) {
        const { name: _name, ...updateData } = formData;
        void _name;
        await HttpClient.patch(
          `/recurring-expenses/${encodeURIComponent(recurringExpense.name)}`,
          updateData,
        );
        showSuccessSnackBar('Recurring expense updated successfully!');
      } else {
        await HttpClient.post('/recurring-expenses', formData);
        showSuccessSnackBar('Recurring expense created successfully!');
      }
      setFormData(initialFormData);
      fetchRecurringExpenses();
      onClose();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to save recurring expense.');
      }
    }
  });

  const setSelectedTags = (selectedTags: string[]) => {
    setFormData((prev) => ({ ...prev, tags: selectedTags }));
  };

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
            value={formData.displayName}
            onChange={(e) => onChangeHandler(e.target.value, 'displayName')}
            error={!!fieldErrors.displayName}
            helperText={getError('displayName')}
            placeholder="e.g. Netflix, Electricity"
          />
        </Box>
        {!isEdit && (
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Identifier"
              variant="outlined"
              value={formData.name}
              onChange={(e) => onChangeHandler(e.target.value, 'name')}
              error={!!fieldErrors.name}
              helperText={getError('name') || 'Unique slug (e.g. netflix, electricity)'}
              placeholder="e.g. netflix"
            />
          </Box>
        )}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Amount Type
          </Typography>
          <ToggleButtonGroup
            value={formData.amountType}
            exclusive
            onChange={(_, val) => val && onChangeHandler(val, 'amountType')}
            size="small"
            fullWidth
          >
            <ToggleButton value="fixed">Fixed</ToggleButton>
            <ToggleButton value="range">Range</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {formData.amountType === 'fixed' ? (
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
        ) : (
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Min Amount"
              variant="outlined"
              type="number"
              value={formData.amountMin || ''}
              onChange={(e) => onChangeHandler(e.target.value, 'amountMin')}
              error={!!fieldErrors.amountMin}
              helperText={getError('amountMin')}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                },
                htmlInput: { min: 0, step: 'any' },
              }}
            />
            <TextField
              fullWidth
              required
              size="small"
              label="Max Amount"
              variant="outlined"
              type="number"
              value={formData.amountMax || ''}
              onChange={(e) => onChangeHandler(e.target.value, 'amountMax')}
              error={!!fieldErrors.amountMax}
              helperText={getError('amountMax')}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                },
                htmlInput: { min: 0, step: 'any' },
              }}
            />
          </Stack>
        )}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            select
            size="small"
            label="Frequency"
            variant="outlined"
            value={formData.frequency}
            onChange={(e) => onChangeHandler(e.target.value, 'frequency')}
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
            <MenuItem value="as_needed">As Needed</MenuItem>
          </TextField>
        </Box>
        {!isAsNeeded && (
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Start Date"
              variant="outlined"
              type="date"
              value={formData.startDate}
              onChange={(e) => onChangeHandler(e.target.value, 'startDate')}
              error={!!fieldErrors.startDate}
              helperText={getError('startDate')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              size="small"
              label="End Date"
              variant="outlined"
              type="date"
              value={formData.endDate}
              onChange={(e) => onChangeHandler(e.target.value, 'endDate')}
              error={!!fieldErrors.endDate}
              helperText={getError('endDate') || 'Optional'}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        )}
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
