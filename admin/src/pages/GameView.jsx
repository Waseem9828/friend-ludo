import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function GameView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get(`/admin/view-game/${id}`);
        setGame(res.data.game || res.data);
      } catch (err) {
        console.error('Failed to fetch game details:', err);
        toast.error('Could not load game view');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!game) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6">Game record not found.</Typography>
        <Button onClick={() => navigate('/admin/hold-games')} sx={{ mt: 2 }}>
          Back to Hold Games
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/hold-games')}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Back to Hold Games
      </Button>

      <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ mb: 2 }}>
        Game Verification & Proof Viewer
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700">
                Creator: {game.createdBy?.Name || 'Player 1'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {game.createdBy?.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Status Posted: <strong>{game.creatorStatus || 'Won / Dispute'}</strong>
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Uploaded Result Screenshot:
              </Typography>
              {game.creatorProof ? (
                <Box
                  component="img"
                  src={game.creatorProof}
                  alt="Creator Screenshot"
                  sx={{ width: '100%', borderRadius: 2, border: '1px solid #e2e8f0', maxHeight: 400, objectFit: 'contain' }}
                />
              ) : (
                <Typography color="text.secondary">No screenshot uploaded</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700">
                Acceptor: {game.acceptedBy?.Name || 'Player 2'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {game.acceptedBy?.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Status Posted: <strong>{game.acceptorStatus || 'Won / Dispute'}</strong>
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Uploaded Result Screenshot:
              </Typography>
              {game.acceptorProof ? (
                <Box
                  component="img"
                  src={game.acceptorProof}
                  alt="Acceptor Screenshot"
                  sx={{ width: '100%', borderRadius: 2, border: '1px solid #e2e8f0', maxHeight: 400, objectFit: 'contain' }}
                />
              ) : (
                <Typography color="text.secondary">No screenshot uploaded</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
