import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Penalty() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApplyPenalty = async (e) => {
    e.preventDefault();
    if (!phone || !amount) {
      toast.error('Please fill in user phone and penalty amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/penalty', { phone, amount: Number(amount), reason });
      toast.success(`Penalty of ₹${amount} applied to ${phone}`);
      setPhone('');
      setAmount('');
      setReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply penalty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Penalty Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Deduct penalty fees or penalize fake screenshot uploaders.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                Apply User Penalty
              </Typography>
              <Box component="form" onSubmit={handleApplyPenalty}>
                <TextField
                  fullWidth
                  label="Select Penalty User (Mobile Number)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Enter Penalty Amount (₹)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Reason / Notes"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Fake screenshot submitted"
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  color="error"
                  disabled={loading}
                  sx={{ py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Apply Penalty Deduction'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
