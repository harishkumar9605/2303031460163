import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="h2" gutterBottom>404</Typography>
      <Typography color="text.secondary" mb={3}>The page you requested was not found.</Typography>
      <Button component={Link} to="/" variant="contained">Go Home</Button>
    </Box>
  );
}
