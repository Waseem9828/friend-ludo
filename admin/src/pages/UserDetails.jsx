import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, AccountBalance, Person, VerifiedUser } from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await api.get(`/admin/details/${id}`);
        setUserData(res.data);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
        toast.error('Could not load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const user = userData?.user || userData || {};
  const transactions = userData?.transactions || user?.history || [];
  const games = userData?.games || user?.gameHistory || [];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/users')}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Back to Users List
      </Button>

      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 3 }}>
        User Details Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={user.avatar || 'https://ludo3.s3.ap-south-1.amazonaws.com/logo.webp'}
                sx={{ width: 80, height: 80, margin: '0 auto', mb: 2, bgcolor: '#6366f1' }}
              >
                {user.Name ? user.Name[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="h6" fontWeight="700">
                {user.Name || 'User Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Phone: {user.Phone || user.phone || 'N/A'}
              </Typography>
              <Chip
                label={user.isBlocked ? 'Blocked' : 'Active Account'}
                color={user.isBlocked ? 'error' : 'success'}
                size="small"
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary">
                  User ID: <strong>{user._id || user.id}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Wallet Balance: <strong style={{ color: '#10b981' }}>₹{user.Wallet || user.wallet || 0}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Referral Code: <strong>{user.referralCode || 'N/A'}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bank & KYC Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, p: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" /> Bank & Payment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    UPI ID: <strong>{user.upiId || user.upi_id || 'Not Provided'}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Account Holder: <strong>{user.accountHolderName || user.bank_name || 'N/A'}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Account Number: <strong>{user.accountNumber || 'N/A'}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    IFSC Code: <strong>{user.ifscCode || 'N/A'}</strong>
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* User History Table */}
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                Recent Transactions History
              </Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        No transaction history available
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.type || tx.closing_type}</TableCell>
                        <TableCell>₹{tx.amount || tx.amount_added}</TableCell>
                        <TableCell>
                          <Chip label={tx.status || 'Success'} size="small" color="success" />
                        </TableCell>
                        <TableCell>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
