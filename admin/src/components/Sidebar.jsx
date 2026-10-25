import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  Payment as TransactionIcon,
  Payment as PaymentIcon,
  VerifiedUser as KycIcon,
  CardGiftcard as BonusIcon,
  ReportProblem as PenaltyIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  History,
  HourglassEmpty,
  CheckCircle,
  AccountBalance
} from '@mui/icons-material';

const drawerWidth = 260;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [gamesOpen, setGamesOpen] = useState(true);
  const [txOpen, setTxOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a1f37', color: '#fff' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Avatar
          src="https://ludobetimages.s3.ap-south-1.amazonaws.com/logo.png"
          alt="Ludo League Logo"
          sx={{ width: 42, height: 42, bgcolor: 'primary.main' }}
        >
          LL
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', fontSize: '1.1rem', letterSpacing: 0.5 }}>
            Ludo League Admin
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Management Portal
          </Typography>
        </Box>
      </Box>

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1.5, px: 1 }}>
        <List component="nav" sx={{ '& .MuiListItemButton-root': { borderRadius: '8px', mb: 0.5 } }}>
          {/* Dashboard */}
          <ListItemButton
            selected={isActive('/admin/dashboard') || isActive('/admin') || isActive('/')}
            onClick={() => handleNavigate('/admin/dashboard')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          {/* Users */}
          <ListItemButton
            selected={isActive('/admin/users')}
            onClick={() => handleNavigate('/admin/users')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Users" />
          </ListItemButton>

          {/* Manage Games */}
          <ListItemButton onClick={() => setGamesOpen(!gamesOpen)}>
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <GamesIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Games" />
            {gamesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={gamesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              <ListItemButton
                selected={isActive('/admin/hold-games')}
                onClick={() => handleNavigate('/admin/hold-games')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <HourglassEmpty fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Hold Games" />
              </ListItemButton>

              <ListItemButton
                selected={isActive('/admin/resolved-games')}
                onClick={() => handleNavigate('/admin/resolved-games')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <CheckCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Resolved Games" />
              </ListItemButton>

              <ListItemButton
                selected={isActive('/admin/total-games')}
                onClick={() => handleNavigate('/admin/total-games')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <History fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Total Games" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Manage Transactions */}
          <ListItemButton onClick={() => setTxOpen(!txOpen)}>
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <TransactionIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Transactions" />
            {txOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={txOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              <ListItemButton
                selected={isActive('/admin/deposits')}
                onClick={() => handleNavigate('/admin/deposits')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <PaymentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Deposits" />
              </ListItemButton>

              <ListItemButton
                selected={isActive('/admin/pending-deposit')}
                onClick={() => handleNavigate('/admin/pending-deposit')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <HourglassEmpty fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Pending Deposits" />
              </ListItemButton>

              <ListItemButton
                selected={isActive('/admin/withdrawal-requests')}
                onClick={() => handleNavigate('/admin/withdrawal-requests')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <AccountBalance fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Withdrawals" />
              </ListItemButton>

              <ListItemButton
                selected={isActive('/admin/bank-withdrawals')}
                onClick={() => handleNavigate('/admin/bank-withdrawals')}
                sx={{
                  '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 36 }}>
                  <AccountBalance fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Bank Withdrawals" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Pending KYC */}
          <ListItemButton
            selected={isActive('/admin/pending_kyc')}
            onClick={() => handleNavigate('/admin/pending_kyc')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <KycIcon />
            </ListItemIcon>
            <ListItemText primary="Pending KYC" />
          </ListItemButton>

          {/* Bonus */}
          <ListItemButton
            selected={isActive('/admin/bonus')}
            onClick={() => handleNavigate('/admin/bonus')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <BonusIcon />
            </ListItemIcon>
            <ListItemText primary="Bonus" />
          </ListItemButton>

          {/* Penalty */}
          <ListItemButton
            selected={isActive('/admin/penalty')}
            onClick={() => handleNavigate('/admin/penalty')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <PenaltyIcon />
            </ListItemIcon>
            <ListItemText primary="Penalty" />
          </ListItemButton>

          {/* Settings */}
          <ListItemButton
            selected={isActive('/admin/settings')}
            onClick={() => handleNavigate('/admin/settings')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>

          {/* Admins */}
          <ListItemButton
            selected={isActive('/admin/admin')}
            onClick={() => handleNavigate('/admin/admin')}
            sx={{
              '&.Mui-selected': { bgcolor: '#2e3759', color: '#6366f1', '& .MuiListItemIcon-root': { color: '#6366f1' } }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <AdminIcon />
            </ListItemIcon>
            <ListItemText primary="Admins" />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
