import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Deposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/deposits');
      setDeposits(res.data.deposits || res.data || []);
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
      toast.error('Could not load deposit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.post(`/admin/deposits/${id}`, { status });
      toast.success(`Deposit request ${status} successfully`);
      fetchDeposits();
    } catch (err) {
      toast.error('Failed to update deposit status');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Deposit Verification & History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Verify manual UTR/UPI deposit proof entries and credit user wallets.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User / Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UTR Number / Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No deposit requests found
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((dep) => (
                <TableRow key={dep._id || dep.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {dep.user?.Name || dep.user_name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dep.user?.phone || dep.mobile}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="success.main">
                      ₹{dep.amount || dep.Deposit_Ammount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>{dep.utr || dep.txn_id || 'N/A'}</TableCell>
                  <TableCell>{dep.createdAt ? new Date(dep.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={dep.status || 'Pending'}
                      color={dep.status === 'Approved' || dep.status === 'SUCCESS' ? 'success' : dep.status === 'Rejected' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {dep.status === 'Pending' || dep.status === 'pending' ? (
                      <>
                        <Tooltip title="Approve & Credit Wallet">
                          <IconButton color="success" onClick={() => handleAction(dep._id || dep.id, 'Approved')}>
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Deposit">
                          <IconButton color="error" onClick={() => handleAction(dep._id || dep.id, 'Rejected')}>
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Completed
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
