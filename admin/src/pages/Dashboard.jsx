import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  HourglassEmpty as HoldIcon,
  Payment as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  VerifiedUser as KycIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={48} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="#0f172a">
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live metrics and operational statistics for Ludo League Admin
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Metrics Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? stats?.usersCount ?? 0}
            icon={<PeopleIcon />}
            color="#3b82f6"
            subtitle="Registered players"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Hold Games"
            value={stats?.holdGames ?? stats?.disputedGames ?? 0}
            icon={<HoldIcon />}
            color="#ef4444"
            subtitle="Disputed games needing review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Deposits"
            value={stats?.pendingDeposits ?? stats?.depositPendingCount ?? 0}
            icon={<DepositIcon />}
            color="#f59e0b"
            subtitle="Manual deposit requests"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Withdrawals"
            value={stats?.pendingWithdrawals ?? stats?.withdrawPendingCount ?? 0}
            icon={<WithdrawIcon />}
            color="#10b981"
            subtitle="Pending payouts"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Games"
            value={stats?.totalGames ?? stats?.gamesCount ?? 0}
            icon={<GamesIcon />}
            color="#8b5cf6"
            subtitle="Total match history"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending KYC"
            value={stats?.pendingKyc ?? stats?.kycCount ?? 0}
            icon={<KycIcon />}
            color="#06b6d4"
            subtitle="Document verification"
          />
        </Grid>
      </Grid>

      {/* Quick Action Shortcuts */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', p: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
            Quick Management Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/users')}
              sx={{ bgcolor: '#3b82f6', borderRadius: 2, textTransform: 'none' }}
            >
              Manage Users
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/hold-games')}
              sx={{ bgcolor: '#ef4444', borderRadius: 2, textTransform: 'none' }}
            >
              Resolve Hold Games
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/deposits')}
              sx={{ bgcolor: '#f59e0b', borderRadius: 2, textTransform: 'none' }}
            >
              Verify Deposits
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/withdrawal-requests')}
              sx={{ bgcolor: '#10b981', borderRadius: 2, textTransform: 'none' }}
            >
              Process Withdrawals
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/settings')}
              sx={{ bgcolor: '#6366f1', borderRadius: 2, textTransform: 'none' }}
            >
              System Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
