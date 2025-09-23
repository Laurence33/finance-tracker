import { Box } from '@mui/material';
import { CiBank } from 'react-icons/ci';
import { BsCash } from 'react-icons/bs';
import { MdOutlineAccountBalanceWallet } from 'react-icons/md';

const logoMap: Record<
  string,
  {
    bgColor: string;
    logo: React.ReactNode;
  }
> = {
  bank: {
    bgColor: 'warning.main',
    logo: <CiBank fontSize={'1.25rem'} color="white" />,
  },
  cash: {
    bgColor: 'success.main',
    logo: <BsCash fontSize={'1.25rem'} color="white" />,
  },
  gcash: {
    bgColor: 'primary.main',
    logo: <MdOutlineAccountBalanceWallet fontSize={'1.25rem'} color="white" />,
  },
};

export default function ExpenseIcon({ fundSource }: { fundSource: string }) {
  const matchedLogo = logoMap[fundSource];
  return (
    <Box
      sx={{
        p: '.25rem',
        bgcolor: matchedLogo.bgColor || 'primary.main',
        borderRadius: '50%',
        width: '2rem',
        height: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {matchedLogo.logo}
    </Box>
  );
}
