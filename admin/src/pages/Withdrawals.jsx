import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/withdrawal-requests');
      setWithdrawals(res.data.withdrawals || res.data || []);
    } catch (err) {
      console.error('Failed to fetch withdrawal requests:', err);
      toast.error('Could not load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.post(`/admin/all-withdraw/${id}`, { status });
      toast.success(`Withdrawal ${status} successfully`);
      fetchWithdrawals();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Withdrawal Requests & Payouts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Process UPI and automatic gateway payouts for user earnings.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User / Mobile</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UPI ID / Payout Target</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No pending withdrawal requests
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((w) => (
                <TableRow key={w._id || w.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {w.user?.Name || w.user_name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {w.user?.phone || w.mobile}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="error.main">
                      ₹{w.amount || w.amount_withdraw || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>{w.upiId || w.upi_id || 'UPI N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={w.status || 'Pending'}
                      color={w.status === 'Approved' ? 'success' : w.status === 'Rejected' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {w.status === 'Pending' || w.status === 'pending' ? (
                      <>
                        <Tooltip title="Approve & Send Payout">
                          <IconButton color="success" onClick={() => handleAction(w._id || w.id, 'Approved')}>
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject & Refund User">
                          <IconButton color="error" onClick={() => handleAction(w._id || w.id, 'Rejected')}>
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Processed
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
