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

export default function PendingDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending-deposit');
      setDeposits(res.data.deposits || res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.post(`/admin/deposits/${id}`, { status });
      toast.success(`Deposit ${status}`);
      fetchPending();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Pending Deposit Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Unverified user top-up requests waiting for admin approval.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UTR / Txn ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  No pending deposits
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((dep) => (
                <TableRow key={dep._id || dep.id}>
                  <TableCell>{dep.user?.Name || dep.mobile}</TableCell>
                  <TableCell>₹{dep.amount || 0}</TableCell>
                  <TableCell>{dep.utr || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Approve">
                      <IconButton color="success" onClick={() => handleAction(dep._id || dep.id, 'Approved')}>
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton color="error" onClick={() => handleAction(dep._id || dep.id, 'Rejected')}>
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
