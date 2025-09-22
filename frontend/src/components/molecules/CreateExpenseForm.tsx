import { HttpClient } from '@/utils/httpClient';
import { TZDate } from '@date-fns/tz';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { useState } from 'react';

type CreateExpenseFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
};

const initialFormData: CreateExpenseFormDataType = {
  amount: 0,
  timestamp: TZDate.tz('asia/singapore').toISOString().slice(0, 23), // Default to current time in Singapore timezone
  fundSource: '',
};

export default function CreateExpenseForm({
  fetchExpenses,
  showSuccessSnackBar,
  showErrorSnackBar,
}: {
  fetchExpenses: () => void;
  showSuccessSnackBar: (message: string) => void;
  showErrorSnackBar: (message: string) => void;
}) {
  const [formData, setFormData] =
    useState<CreateExpenseFormDataType>(initialFormData);

  const onChangeHandler = (event: any, field: string) => {
    let value = event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(event.target.value);
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
    console.log('Form submitted:', formData);
    try {
      await HttpClient.post('/expenses', formData);
      setFormData(initialFormData);
      fetchExpenses();
      showSuccessSnackBar('Expense added successfully!');
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to add expense.');
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <Box component="div" sx={{ p: 2, maxWidth: 280 }}>
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
            <MenuItem value={'cash'}>Cash</MenuItem>
            <MenuItem value={'bank'}>Bank</MenuItem>
            <MenuItem value={'gcash'}>GCash</MenuItem>
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
            value={formData.timestamp}
            onChange={(event) => onChangeHandler(event, 'timestamp')}
          />
        </Box>
        <Button type="submit" variant="contained">
          Submit
        </Button>
      </Box>
    </form>
  );
}
