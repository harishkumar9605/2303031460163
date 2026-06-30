import { Box, Card, CardContent, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">{user?.name}</Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
          <Typography mt={2}>Role: {user?.role}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
