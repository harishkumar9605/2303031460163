import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({ unreadCount: 0, total: 0 });
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/notifications/unread-count'),
      api.get('/notifications?limit=5')
    ]).then(([countRes, listRes]) => {
      setStats({ unreadCount: countRes.data.data.unreadCount, total: listRes.data.meta.total });
      setNotifications(listRes.data.data);
    });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography color="text.secondary" mb={3}>Monitor your campus hiring updates and priority alerts.</Typography>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography variant="h6">Unread notifications</Typography><Typography variant="h3">{stats.unreadCount}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography variant="h6">Total notifications</Typography><Typography variant="h3">{stats.total}</Typography></CardContent></Card>
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent notifications</Typography>
            <Button onClick={() => navigate('/notifications')}>View all</Button>
          </Stack>
          {notifications.map((item) => (
            <Box key={item.id} sx={{ borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={600}>{item.title}</Typography>
                  <Typography color="text.secondary" variant="body2">{item.message}</Typography>
                </Box>
                <Chip label={item.type} color={item.type === 'Placement' ? 'error' : 'primary'} size="small" />
              </Stack>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
