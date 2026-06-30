import { Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function PriorityNotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/priority?top=10').then((response) => {
      setItems(response.data.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Priority Notifications</Typography>
      <Typography color="text.secondary" mb={3}>Top-priority alerts using weighted scoring and recency.</Typography>
      {loading ? <CircularProgress /> : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{item.title}</Typography>
                    <Typography color="text.secondary">{item.message}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={item.type} color="secondary" size="small" />
                    <Chip label={`Score ${Math.round(item.priorityScore)}`} size="small" />
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
