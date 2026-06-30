import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (err) {
      setError('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const filtered = notifications.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    loadNotifications();
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h4">All Notifications</Typography>
          <Typography color="text.secondary">Browse, search, and manage your campus updates.</Typography>
        </Box>
        <Button variant="contained" onClick={markAllRead}>Mark all as read</Button>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filter} label="Type" onChange={(e) => setFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Stack spacing={2}>
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography fontWeight={600}>{item.title}</Typography>
                    <Typography color="text.secondary">{item.message}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={item.type} color={item.type === 'Placement' ? 'error' : 'primary'} size="small" />
                    {!item.isRead && <Chip label="Unread" color="warning" size="small" />}
                    <Button component={Link} to={`/notifications/${item.id}`}>Open</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
