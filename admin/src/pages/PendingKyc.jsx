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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Visibility as ViewIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function PendingKyc() {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Document view dialog state
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchKycList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending_kyc');
      setKycList(res.data.kycs || res.data || []);
    } catch (err) {
      console.error('Failed to fetch KYC records:', err);
      toast.error('Could not load KYC verification list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, []);

  const handleKycAction = async (id, status) => {
    try {
      await api.post(`/admin/pending-kyc/${id}`, { status });
      toast.success(`KYC document ${status} successfully`);
      setViewDialogOpen(false);
      fetchKycList();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleView = (kyc) => {
    setSelectedKyc(kyc);
    setViewDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Pending KYC Verifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review Aadhaar / PAN card documents uploaded by players.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User / Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Aadhaar Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>PAN Number</TableCell>
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
            ) : kycList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No pending KYC verifications found
                </TableCell>
              </TableRow>
            ) : (
              kycList.map((item) => (
                <TableRow key={item._id || item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {item.user?.Name || item.Name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.user?.phone || item.Phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.aadhaarNumber || item.aadhar_no || 'N/A'}</TableCell>
                  <TableCell>{item.panNumber || item.pan_no || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label="Pending" color="warning" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Document Images">
                      <IconButton color="primary" onClick={() => handleView(item)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve KYC">
                      <IconButton color="success" onClick={() => handleKycAction(item._id || item.id, 'Approved')}>
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject KYC">
                      <IconButton color="error" onClick={() => handleKycAction(item._id || item.id, 'Rejected')}>
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

      {/* View Modal */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>KYC Document Verification</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedKyc && (
            <Box>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                Aadhaar Document:
              </Typography>
              {selectedKyc.aadhaarImage ? (
                <Box
                  component="img"
                  src={selectedKyc.aadhaarImage}
                  alt="Aadhaar"
                  sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 2, mb: 2 }}
                />
              ) : (
                <Typography color="text.secondary" sx={{ mb: 2 }}>No Aadhaar image</Typography>
              )}

              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                PAN Document:
              </Typography>
              {selectedKyc.panImage ? (
                <Box
                  component="img"
                  src={selectedKyc.panImage}
                  alt="PAN"
                  sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 2 }}
                />
              ) : (
                <Typography color="text.secondary">No PAN image</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedKyc && (
            <>
              <Button color="error" variant="contained" onClick={() => handleKycAction(selectedKyc._id || selectedKyc.id, 'Rejected')}>
                Reject KYC
              </Button>
              <Button color="success" variant="contained" onClick={() => handleKycAction(selectedKyc._id || selectedKyc.id, 'Approved')}>
                Approve KYC
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
