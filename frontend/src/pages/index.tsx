import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import React, { useState, useEffect } from 'react';
import { TZDate } from '@date-fns/tz';
import { HttpClient } from '../utils/httpClient';

interface SnackBarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

type FormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
};

const initalFormData: FormDataType = {
  amount: 0,
  timestamp: TZDate.tz('asia/singapore').toISOString().slice(0, 23), // Default to current time in Singapore timezone
  fundSource: '',
};

type Expense = {
  amount: number;
  timestamp: string;
  fundSource: string;
};

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>(initalFormData);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const response = await HttpClient.get<any>('/expenses');
      if (response && response.data) {
        setExpenses(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      setSnackBarState((prevState) => ({
        ...prevState,
        open: true,
        message: error.message,
        severity: 'error',
      }));
    }
  }

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
      setFormData(initalFormData);
      fetchExpenses();
      setSnackBarState((prevState) => ({
        ...prevState,
        open: true,
        message: 'Expense added successfully!',
        severity: 'success',
      }));
    } catch (error: any) {
      setSnackBarState((prevState) => ({
        ...prevState,
        open: true,
        message: error.message,
        severity: 'error',
      }));
    }
  };

  const handleSnackBarClose = () => {
    setSnackBarState({ ...snackBarState, open: false });
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={snackBarState.open}
        onClose={handleSnackBarClose}
        // message={snackBarState.message}
        autoHideDuration={5000}
      >
        <Alert
          onClose={handleSnackBarClose}
          severity={snackBarState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackBarState.message}
        </Alert>
      </Snackbar>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 5 }}
      >
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

        <Box
          component="div"
          sx={{ ml: 6, p: 2, width: 280, height: 280, overflow: 'scroll' }}
        >
          <Stack spacing={1}>
            {expenses.map((expense) => (
              <Box
                key={expense.timestamp}
                sx={{ p: 1, border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <div>{expense.fundSource}</div>
                <div>${expense.amount}</div>
                <div>{expense.timestamp}</div>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  );
}
