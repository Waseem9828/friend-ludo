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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { Visibility as ViewIcon, Gavel as ResolveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function HoldGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal state
  const [selectedGame, setSelectedGame] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [winnerId, setWinnerId] = useState('');

  const fetchHoldGames = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/hold-games');
      if (res.data) {
        setGames(res.data.games || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch hold games:', err);
      toast.error('Could not load disputed games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldGames();
  }, []);

  const handleOpenResolveModal = (game) => {
    setSelectedGame(game);
    setWinnerId('');
    setResolveModalOpen(true);
  };

  const handleResolveGame = async () => {
    if (!winnerId) {
      toast.error('Please select a winner or choose Cancel Game');
      return;
    }
    try {
      await api.post('/admin/update-challenge', {
        gameId: selectedGame._id || selectedGame.id,
        winnerId,
        status: winnerId === 'cancel' ? 'cancelled' : 'completed'
      });
      toast.success('Game outcome updated successfully');
      setResolveModalOpen(false);
      fetchHoldGames();
    } catch (err) {
      toast.error('Failed to resolve game outcome');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 1 }}>
        Hold Games (Disputed Battles)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review disputed Ludo match screenshots and assign the winner or declare a draw.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Game ID / Room Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Creator (Player 1)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acceptor (Player 2)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
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
            ) : games.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No active hold/disputed games found
                </TableCell>
              </TableRow>
            ) : (
              games.map((game) => (
                <TableRow key={game._id || game.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700">
                      ID: {game._id || game.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Room Code: {game.roomCode || game.Room_Code || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {game.createdBy?.Name || game.createdBy?.phone || 'Player 1'}
                  </TableCell>
                  <TableCell>
                    {game.acceptedBy?.Name || game.acceptedBy?.phone || 'Player 2'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      ₹{game.amount || game.Game_Ammount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Hold / Dispute" color="error" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Detailed Proofs">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/admin/view-game/${game._id || game.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Resolve Dispute">
                      <IconButton color="secondary" onClick={() => handleOpenResolveModal(game)}>
                        <ResolveIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resolve Dialog Modal */}
      <Dialog open={resolveModalOpen} onClose={() => setResolveModalOpen(false)}>
        <DialogTitle>Resolve Game Conflict</DialogTitle>
        <DialogContent sx={{ minWidth: 360, pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select the valid winner based on submitted proof screenshots:
          </Typography>
          {selectedGame && (
            <RadioGroup value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
              <FormControlLabel
                value={selectedGame.createdBy?._id || selectedGame.createdBy?.id || 'player1'}
                control={<Radio />}
                label={`Declare ${selectedGame.createdBy?.Name || 'Player 1'} as Winner`}
              />
              <FormControlLabel
                value={selectedGame.acceptedBy?._id || selectedGame.acceptedBy?.id || 'player2'}
                control={<Radio />}
                label={`Declare ${selectedGame.acceptedBy?.Name || 'Player 2'} as Winner`}
              />
              <FormControlLabel
                value="cancel"
                control={<Radio />}
                label="Cancel Game & Refund Both Players"
              />
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResolveGame} sx={{ bgcolor: '#6366f1' }}>
            Submit Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
