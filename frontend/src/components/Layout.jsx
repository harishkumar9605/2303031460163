import { AppBar, Avatar, Badge, Box, CssBaseline, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { Dashboard, Logout, Notifications, PriorityHigh, Person, ViewList } from '@mui/icons-material';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const drawerWidth = 240;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then((res) => setUnreadCount(res.data.data.unreadCount));
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5001', {
      auth: { token: localStorage.getItem('token') }
    });
    socket.on('notification:new', (notification) => {
      setUnreadCount((count) => count + 1);
      toast.info(`New notification: ${notification.title}`);
    });
    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Campus Hiring Hub</Typography>
          <IconButton color="inherit" component={Link} to="/notifications">
            <Badge badgeContent={unreadCount} color="error"><Notifications /></Badge>
          </IconButton>
          <Avatar sx={{ ml: 2 }}>{user?.name?.[0] || 'U'}</Avatar>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton selected={location.pathname === '/'} component={Link} to="/">
              <ListItemIcon><Dashboard /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            <ListItemButton selected={location.pathname.startsWith('/notifications')} component={Link} to="/notifications">
              <ListItemIcon><ViewList /></ListItemIcon>
              <ListItemText primary="All Notifications" />
            </ListItemButton>
            <ListItemButton selected={location.pathname === '/priority'} component={Link} to="/priority">
              <ListItemIcon><PriorityHigh /></ListItemIcon>
              <ListItemText primary="Priority" />
            </ListItemButton>
            <ListItemButton selected={location.pathname === '/profile'} component={Link} to="/profile">
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
