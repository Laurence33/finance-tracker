import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { TZDate } from '@date-fns/tz';
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { HttpClient } from '../utils/httpClient';

type FormDataType = {
  amount: number;
  timestamp: string;
  fundSource: string;
};

const initalFormData: FormDataType = {
  amount: 0,
  timestamp: TZDate.tz('asia/singapore').toISOString().slice(0, 16), // Default to current time in Singapore timezone
  fundSource: '',
};

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>(initalFormData);

  const onChangeHandler = (event: any, field: string) => {
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        [field]: event.target.value,
      };
    });
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form submitted:', formData);
    try {
      const response = await HttpClient.post('/expenses', formData);
      console.log('Response from server:', response);
      // setFormData(initalFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
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
    </>
  );
}
