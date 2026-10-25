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
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  AccountBalanceWallet as EditWalletIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Wallet adjustment modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('add');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page: page + 1, limit: rowsPerPage, search }
      });
      if (res.data) {
        setUsers(res.data.users || res.data || []);
        setTotalCount(res.data.total || (res.data.users ? res.data.users.length : (res.data.length || 0)));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleToggleBlock = async (userId, currentBlocked) => {
    try {
      await api.post(`/admin/block/${userId}`, { isBlocked: !currentBlocked });
      toast.success(currentBlocked ? 'User unblocked successfully' : 'User blocked successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleOpenWalletModal = (user) => {
    setSelectedUser(user);
    setAmount('');
    setOperation('add');
    setWalletModalOpen(true);
  };

  const handleUpdateWallet = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    try {
      await api.post(`/admin/wallet/${selectedUser._id || selectedUser.id}`, {
        amount: Number(amount),
        type: operation
      });
      toast.success(`Wallet updated successfully (${operation === 'add' ? '+' : '-'}${amount})`);
      setWalletModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update wallet');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="700" color="#0f172a">
          User Management
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Mobile, Name, or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button variant="contained" type="submit" sx={{ bgcolor: '#6366f1', textTransform: 'none', px: 3 }}>
            Search
          </Button>
        </Box>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mobile / Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Wallet Balance</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>KYC Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id || user.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {user.Name || user.name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.Phone || user.mobile || user.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{user._id || user.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="success.main">
                      ₹{user.Wallet || user.wallet || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.verified ? 'Verified' : 'Pending/Unverified'}
                      color={user.verified ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isBlocked ? 'Blocked' : 'Active'}
                      color={user.isBlocked ? 'error' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View User Details">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/admin/details/${user._id || user.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Wallet Balance">
                      <IconButton color="secondary" onClick={() => handleOpenWalletModal(user)}>
                        <EditWalletIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user.isBlocked ? 'Unblock User' : 'Block User'}>
                      <IconButton
                        color={user.isBlocked ? 'success' : 'error'}
                        onClick={() => handleToggleBlock(user._id || user.id, user.isBlocked)}
                      >
                        {user.isBlocked ? <UnblockIcon /> : <BlockIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Wallet Edit Dialog */}
      <Dialog open={walletModalOpen} onClose={() => setWalletModalOpen(false)}>
        <DialogTitle>Update User Wallet Balance</DialogTitle>
        <DialogContent sx={{ minWidth: 320, pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            User: <strong>{selectedUser?.Name || selectedUser?.phone}</strong>
          </Typography>
          <TextField
            select
            fullWidth
            label="Operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="add">Add Chips / Deposit (+)</option>
            <option value="subtract">Deduct / Penalty (-)</option>
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateWallet} sx={{ bgcolor: '#6366f1' }}>
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
