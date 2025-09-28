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

type CreateExpenseFormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
};

const initialFormData: CreateExpenseFormDataType = {
  amount: 0,
  timestamp: currentTimestampForInput(),
  fundSource: '',
};

export default function CreateExpenseForm() {
  const { showErrorSnackBar, showSuccessSnackBar, fetchExpenses } =
    use(AppContext);
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
    try {
      await HttpClient.post('/expenses', formData);
      setFormData({
        ...initialFormData,
        timestamp: currentTimestampForInput(),
      });
      fetchExpenses();
      showSuccessSnackBar('Expense added successfully!');
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to add expense.');
    }
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
            fullWidth={true}
            value={formData.timestamp}
            onChange={(event) => onChangeHandler(event, 'timestamp')}
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
