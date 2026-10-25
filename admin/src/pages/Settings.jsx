import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress
} from '@mui/material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Settings() {
  const [settings, setSettings] = useState({
    upiId: '',
    minDeposit: 50,
    maxDeposit: 10000,
    minWithdrawal: 100,
    maxWithdrawal: 25000,
    whatsappNumber: '',
    telegramLink: '',
    notice: '',
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...(res.data.settings || res.data) }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings', settings);
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        System Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure payment gateway details, transaction thresholds, and platform notices.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Payment & Gateway Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                  Payment & UPI Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Official Manual UPI ID"
                  name="upiId"
                  value={settings.upiId}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Deposit (₹)"
                      name="minDeposit"
                      value={settings.minDeposit}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Deposit (₹)"
                      name="maxDeposit"
                      value={settings.maxDeposit}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={6} sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Withdrawal (₹)"
                      name="minWithdrawal"
                      value={settings.minWithdrawal}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={6} sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Withdrawal (₹)"
                      name="maxWithdrawal"
                      value={settings.maxWithdrawal}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Platform Communication & Notice */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                  Support & Notice Banner
                </Typography>
                <TextField
                  fullWidth
                  label="WhatsApp Support Phone"
                  name="whatsappNumber"
                  value={settings.whatsappNumber}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Telegram Group/Channel Link"
                  name="telegramLink"
                  value={settings.telegramLink}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Global Notice Banner Text"
                  name="notice"
                  value={settings.notice}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange}
                      name="maintenanceMode"
                      color="error"
                    />
                  }
                  label="Enable Platform Maintenance Mode"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: '#6366f1', py: 1.5, px: 4, borderRadius: 2, fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save System Settings'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
