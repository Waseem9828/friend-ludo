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
  CircularProgress
} from '@mui/material';
import api from '../services/api';

export default function ResolvedGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResolved = async () => {
      try {
        const res = await api.get('/admin/resolved-games');
        setGames(res.data.games || res.data || []);
      } catch (err) {
        console.error('Failed to fetch resolved games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResolved();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Resolved Games History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Completed and settled Ludo matches history.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Game ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Winner</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Loser</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : games.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No resolved games found
                </TableCell>
              </TableRow>
            ) : (
              games.map((g) => (
                <TableRow key={g._id || g.id}>
                  <TableCell>{g._id || g.id}</TableCell>
                  <TableCell>{g.winner?.Name || 'Winner'}</TableCell>
                  <TableCell>{g.loser?.Name || 'Loser'}</TableCell>
                  <TableCell>₹{g.amount || 0}</TableCell>
                  <TableCell>
                    <Chip label="Resolved" color="success" size="small" />
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
