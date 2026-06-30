import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function NotificationDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/notifications/${id}`).then((res) => setItem(res.data.data)).catch(() => setError('Notification not found')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Button onClick={() => navigate('/notifications')} sx={{ mb: 2 }}>Back</Button>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>{item.title}</Typography>
          <Typography color="text.secondary" mb={2}>{item.message}</Typography>
          <Stack direction="row" spacing={1} mb={2}>
            <Typography fontWeight={600}>Type:</Typography>
            <Typography>{item.type}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Created: {new Date(item.createdAt).toLocaleString()}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
