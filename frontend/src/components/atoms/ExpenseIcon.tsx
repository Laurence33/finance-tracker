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
    bgColor: '#f59e0b',
    logo: <CiBank fontSize={'1.1rem'} color="white" />,
  },
  cash: {
    bgColor: '#10b981',
    logo: <BsCash fontSize={'1.1rem'} color="white" />,
  },
  gcash: {
    bgColor: '#6366f1',
    logo: <MdOutlineAccountBalanceWallet fontSize={'1.1rem'} color="white" />,
  },
};

const defaultLogo = {
  bgColor: '#64748b',
  logo: <MdOutlineAccountBalanceWallet fontSize={'1.1rem'} color="white" />,
};

export default function ExpenseIcon({ fundSource }: { fundSource: string }) {
  const matchedLogo = logoMap[fundSource] || defaultLogo;
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: matchedLogo.bgColor,
        flexShrink: 0,
      }}
    >
      {matchedLogo.logo}
    </Box>
  );
}
