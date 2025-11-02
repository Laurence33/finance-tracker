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
} from '@mui/material';
import { use, useState } from 'react';
import ChipSelectMultiple from '@/components/atoms/ChipSelectMultiple';

type ExpenseFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
  tags: string[];
};

const initialFormData: ExpenseFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
  tags: [],
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

  // TODO: it might be a good idea to refresh the fund sources list here when the form loads
  // in case there are new fund sources added since the page load
  // but let's handle that later

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
      <Box component="div" sx={{ maxWidth: 340 }}>
        <FormControl sx={{ mb: 2, minWidth: 120, width: '100%' }}>
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
        <Box component="div" sx={{ mb: 2 }}>
          <TextField
            sx={{ width: '100%' }}
            required
            id="outlined-basic"
            label="Amount"
            variant="outlined"
            type="number"
            value={formData.amount}
            onChange={(event) => onChangeHandler(event, 'amount')}
          />
        </Box>
        <Box component="div" sx={{ mb: 2 }}>
          <TextField
            required
            id="outlined-basic"
            label="Timestamp"
            variant="outlined"
            type="datetime-local"
            fullWidth={true}
            value={formData.timestamp}
            onChange={(event) => onChangeHandler(event, 'timestamp')}
          />
        </Box>
        <Box component="div" sx={{ mb: 2 }}>
          <ChipSelectMultiple
            label="Tags"
            required={true}
            list={tags.map((tag) => tag.name)}
            setSelectedItems={setSelectedTags}
            selectedItems={formData.tags}
          />
        </Box>
        <Stack direction="row" justifyContent="end" sx={{ mt: 3 }}>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
