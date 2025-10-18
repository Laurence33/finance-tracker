import { Stack, Box, IconButton, Button } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { use, useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import { AppContext } from '@/context/AppContext';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function MonthSelector() {
  const { setSelectedMonth } = use(AppContext);
  const today = new Date();
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    setYearState();
  }, [monthIndex, year]);

  const handlePrev = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else {
      setMonthIndex(monthIndex - 1);
    }
  };

  const handleNext = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else {
      setMonthIndex(monthIndex + 1);
    }
  };

  const setYearState = () => {
    const dateString = `${months[monthIndex]} 1, ${year}`;
    const date = parse(dateString, 'MMMM d, yyyy', new Date());
    setSelectedMonth(format(date, 'yyyy-MM'));
  };
  return (
    <Stack
      sx={{ mb: 2 }}
      direction="row"
      alignItems="center"
      justifyContent="center"
    >
      <Box>
        <IconButton
          color="primary"
          aria-label="previous month"
          onClick={handlePrev}
        >
          <ArrowBackIosIcon />
        </IconButton>

        <Button variant="outlined" sx={{ mx: 1 }}>
          {months[monthIndex]} {year}
        </Button>

        <IconButton
          color="primary"
          aria-label="next month"
          onClick={handleNext}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
