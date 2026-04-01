import { Stack, IconButton, Typography, Box } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { use, useEffect, useState } from 'react';
import { format } from 'date-fns';
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
    const date = new Date(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
    setSelectedMonth(format(date, 'yyyy-MM'));
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ mb: 2.5 }}
    >
      <IconButton
        onClick={handlePrev}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ArrowBackIosIcon sx={{ fontSize: 16 }} />
      </IconButton>

      <Box
        sx={{
          mx: 2,
          px: 3,
          py: 0.75,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          minWidth: 180,
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {months[monthIndex]} {year}
        </Typography>
      </Box>

      <IconButton
        onClick={handleNext}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}
