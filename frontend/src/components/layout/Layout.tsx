import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import RepeatIcon from '@mui/icons-material/Repeat';
import { signOut } from 'aws-amplify/auth';

const bottomNavItems = [
  { label: 'Expenses', icon: <ReceiptLongIcon />, path: '/' },
  { label: 'Wallet', icon: <AccountBalanceWalletIcon />, path: '/wallet' },
];

const drawerItems = [
  { label: 'Expenses', icon: <ReceiptLongIcon />, path: '/' },
  { label: 'Wallet', icon: <AccountBalanceWalletIcon />, path: '/wallet' },
  { label: 'Lendings', icon: <HandshakeIcon />, path: '/lendings' },
  { label: 'Recurring', icon: <RepeatIcon />, path: '/recurring' },
  { label: 'Manage Tags', icon: <LocalOfferIcon />, path: '/tags' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentBottomIndex = bottomNavItems.findIndex(
    (item) => item.path === router.pathname
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <AccountBalanceWalletIcon
            sx={{ color: 'primary.main', mr: 1.5, fontSize: 28 }}
          />
          <Typography
            variant="h6"
            sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}
          >
            Finance Tracker
          </Typography>
          <IconButton
            onClick={() => signOut()}
            sx={{ color: 'text.primary' }}
            aria-label="Sign out"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: 'background.paper',
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Finance Tracker
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Manage your finances
          </Typography>
        </Box>
        <Divider />
        <List sx={{ pt: 1 }}>
          {drawerItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={router.pathname === item.path}
                onClick={() => {
                  router.push(item.path);
                  setDrawerOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      router.pathname === item.path
                        ? 'primary.main'
                        : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontWeight: router.pathname === item.path ? 600 : 400,
                      fontSize: '0.9rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ pb: '80px' }}>{children}</Box>

      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={currentBottomIndex === -1 ? false : currentBottomIndex}
          onChange={(_, newValue) => {
            router.push(bottomNavItems[newValue].path);
          }}
          sx={{
            bgcolor: 'background.paper',
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 600,
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
