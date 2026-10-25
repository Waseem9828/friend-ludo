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

export default function BankWithdrawals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBankWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bank-withdrawals');
      setItems(res.data.withdrawals || res.data || []);
    } catch (err) {
      console.error('Failed to fetch bank withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankWithdrawals();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.post(`/admin/all-withdraw/${id}`, { status });
      toast.success(`Bank payout ${status}`);
      fetchBankWithdrawals();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Direct Bank Withdrawal Payouts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Process manual bank transfer payouts (Account No & IFSC).
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bank Account / IFSC</TableCell>
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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No bank withdrawal requests
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b._id || b.id}>
                  <TableCell>{b.user?.Name || b.phone}</TableCell>
                  <TableCell>₹{b.amount || 0}</TableCell>
                  <TableCell>
                    {b.accountNumber} ({b.ifscCode})
                  </TableCell>
                  <TableCell>
                    <Chip label={b.status || 'Pending'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Approve Bank Payout">
                      <IconButton color="success" onClick={() => handleAction(b._id || b.id, 'Approved')}>
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject & Refund">
                      <IconButton color="error" onClick={() => handleAction(b._id || b.id, 'Rejected')}>
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
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
