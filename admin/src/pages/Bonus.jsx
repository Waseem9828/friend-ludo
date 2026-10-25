import React, { useState, useEffect } from 'react';
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

export default function Bonus() {
  const [bonusAmount, setBonusAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGrantBonus = async (e) => {
    e.preventDefault();
    if (!phone || !bonusAmount) {
      toast.error('Please enter mobile number and bonus amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/bonus', { phone, amount: Number(bonusAmount) });
      toast.success(`Signup / Promotional bonus of ₹${bonusAmount} credited to ${phone}`);
      setBonusAmount('');
      setPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant bonus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Bonus Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Distribute signup or promotional bonus funds directly to user wallets.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                Grant User Bonus
              </Typography>
              <Box component="form" onSubmit={handleGrantBonus}>
                <TextField
                  fullWidth
                  label="Target User Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Bonus Amount (₹)"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="e.g. 50"
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ bgcolor: '#6366f1', py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Credit Bonus Amount'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
