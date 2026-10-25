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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress
} from '@mui/material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Admin modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    permissions: {
      view_users: true,
      manage_users: true,
      view_deposits: true,
      view_withdrawals: true,
      view_total_games: true,
      view_hold_games: true,
      view_bonus: true,
      view_penalty: true,
      view_settings: false
    }
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/management/admins');
      setAdmins(res.data.admins || res.data || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handlePermChange = (permKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey]
      }
    }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      try {
        await api.post('/admin/admin', formData);
      } catch (err1) {
        try {
          await api.post('/admin/register', formData);
        } catch (err2) {
          await api.post('/admin/management/admins', formData);
        }
      }
      toast.success('New Admin registered successfully');
      setAddModalOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating new admin account');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="#0f172a">
            Admin Team Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage admin users, assigned roles, and granular permissions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setAddModalOpen(true)}
          sx={{ bgcolor: '#6366f1', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add New Admin
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Admin Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email / Username</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Active Permissions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  No extra admin accounts registered
                </TableCell>
              </TableRow>
            ) : (
              admins.map((adm) => (
                <TableRow key={adm._id || adm.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {adm.name || 'Admin'}
                    </Typography>
                  </TableCell>
                  <TableCell>{adm.email}</TableCell>
                  <TableCell>
                    <Chip label={adm.role || 'Admin'} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      Full Access
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Admin Dialog */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Sub-Admin</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Admin Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
              Select Admin Permissions:
            </Typography>
            <Grid container spacing={1}>
              {Object.keys(formData.permissions).map((permKey) => (
                <Grid item xs={6} key={permKey}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.permissions[permKey]}
                        onChange={() => handlePermChange(permKey)}
                      />
                    }
                    label={permKey.replace('_', ' ').toUpperCase()}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAdmin} sx={{ bgcolor: '#6366f1' }}>
            Create Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
