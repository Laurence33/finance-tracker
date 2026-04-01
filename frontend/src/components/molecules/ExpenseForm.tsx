import { AppContext } from '@/context/AppContext';
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

type ExpenseFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
  tags: string[];
  notes: string;
};

const initialFormData: ExpenseFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
  tags: [],
  notes: '',
};

export default function ExpenseForm() {
  const {
    showErrorSnackBar,
    showSuccessSnackBar,
    fetchExpenses,
    selectedExpense,
    setExpenseFormOpen,
    formAction,
    fundSources,
    tags,
  } = use(AppContext);
  const [formData, setFormData] = useState<ExpenseFormDataType>(
    formAction == 'update'
      ? selectedExpense!
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

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (formAction === 'update') {
        await HttpClient.patch(
          '/expenses?timestamp=' + selectedExpense?.timestamp,
          formData
        );
        showSuccessSnackBar('Expense updated successfully!');
      } else if (formAction === 'create') {
        await HttpClient.post('/expenses', formData);
        showSuccessSnackBar('Expense added successfully!');
      }
      setExpenseFormOpen(false);
      setFormData({
        ...initialFormData,
        timestamp: currentTimestampForInput(),
      });
      fetchExpenses();
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to add expense.');
    }
  };

  const setSelectedTags = (tags: string[]) => {
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        tags: tags,
      };
    });
  };

  return (
    <form onSubmit={submitHandler}>
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
            sx={{ minWidth: 100 }}
          >
            {formAction === 'create' ? 'Add' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
