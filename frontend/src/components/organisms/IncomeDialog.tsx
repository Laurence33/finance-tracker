import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IncomeForm from '../molecules/IncomeForm';
import { AppContext } from '@/context/AppContext';
import { use } from 'react';

export default function IncomeDialog() {
  const { incomeFormAction, incomeFormOpen, setIncomeFormOpen } = use(AppContext);
  return (
    <Dialog
      open={incomeFormOpen}
      onClose={() => setIncomeFormOpen(false)}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">
            {incomeFormAction === 'create' ? 'New Income' : 'Edit Income'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIncomeFormOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <IncomeForm />
      </DialogContent>
    </Dialog>
  );
}
