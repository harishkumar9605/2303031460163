require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const logger = require('./config/logger');
const { authenticate } = require('./middleware/auth');
const { validate } = require('./middleware/validate');
const { errorHandler } = require('./middleware/errorHandler');
const { seedData } = require('./utils/seedData');
const { getTopPriorityNotifications } = require('./utils/priority');
const { createQueueService } = require('./services/queueService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const store = {
  users: [],
  notifications: [],
  refreshTokens: {}
};

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(express.json());
app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Campus Hiring Notification API', version: '1.0.0' },
    servers: [{ url: '/api' }]
  },
  apis: []
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.user.id);
  logger.info('Socket connected', { userId: socket.user.id });
  socket.on('disconnect', () => logger.info('Socket disconnected', { userId: socket.user.id }));
});

app.locals.io = io;
app.locals.store = store;
app.locals.queue = createQueueService();

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.string().optional()
  })
});

const notificationCreateSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    message: z.string().min(3),
    type: z.enum(['Event', 'Result', 'Placement', 'Interview', 'Reminder', 'System']),
    userIds: z.array(z.string()).optional(),
    userId: z.string().optional()
  })
});

const querySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    type: z.enum(['Event', 'Result', 'Placement', 'Interview', 'Reminder', 'System']).optional(),
    isRead: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

app.post('/api/auth/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role = 'student' } = req.validated.body;
    const existing = store.users.find((user) => user.email === email);
    if (existing) return res.status(409).json({ success: false, message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: `user-${Date.now()}`, email, passwordHash, name, role };
    store.users.push(user);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });
    store.refreshTokens[refreshToken] = user.id;

    res.status(201).json({ success: true, message: 'User registered', data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token, refreshToken } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = store.users.find((item) => item.email === email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });
    store.refreshTokens[refreshToken] = user.id;

    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token, refreshToken } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !store.refreshTokens[refreshToken]) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
  const userId = store.refreshTokens[refreshToken];
  const user = store.users.find((item) => item.id === userId);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
  res.json({ success: true, data: { token } });
});

app.get('/api/profile', authenticate, (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id);
  res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
});

app.get('/api/notifications', authenticate, validate(querySchema), (req, res) => {
  const { page = 1, limit = 20, type, isRead, sortBy = 'createdAt', sortOrder = 'desc' } = req.validated.query;
  const filtered = store.notifications.filter((item) => item.userId === req.user.id && (type ? item.type === type : true) && (typeof isRead === 'boolean' ? item.isRead === isRead : true));
  filtered.sort((a, b) => {
    const left = a[sortBy] || '';
    const right = b[sortBy] || '';
    if (sortBy === 'createdAt') {
      return sortOrder === 'asc' ? new Date(left) - new Date(right) : new Date(right) - new Date(left);
    }
    return sortOrder === 'asc' ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left));
  });
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);
  res.json({ success: true, data: paged, meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } });
});

app.get('/api/notifications/unread', authenticate, validate(querySchema), (req, res) => {
  const { page = 1, limit = 20, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.validated.query;
  const filtered = store.notifications.filter((item) => item.userId === req.user.id && !item.isRead && (type ? item.type === type : true));
  filtered.sort((a, b) => {
    const left = a[sortBy] || '';
    const right = b[sortBy] || '';
    if (sortBy === 'createdAt') {
      return sortOrder === 'asc' ? new Date(left) - new Date(right) : new Date(right) - new Date(left);
    }
    return sortOrder === 'asc' ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left));
  });
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);
  res.json({ success: true, data: paged, meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } });
});

app.get('/api/notifications/unread-count', authenticate, (req, res) => {
  const count = store.notifications.filter((item) => item.userId === req.user.id && !item.isRead).length;
  res.json({ success: true, data: { unreadCount: count } });
});

app.get('/api/notifications/priority', authenticate, (req, res) => {
  const top = Number(req.query.top || 10);
  const userNotifications = store.notifications.filter((item) => item.userId === req.user.id);
  res.json({ success: true, data: getTopPriorityNotifications(userNotifications, top) });
});

app.get('/api/notifications/:id', authenticate, (req, res) => {
  const item = store.notifications.find((notification) => notification.id === req.params.id && notification.userId === req.user.id);
  if (!item) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, data: item });
});

app.post('/api/notifications', authenticate, validate(notificationCreateSchema), async (req, res, next) => {
  try {
    const { title, message, type, userIds = [], userId } = req.validated.body;
    const recipients = userIds.length ? userIds : [userId || req.user.id];
    const created = recipients.map((recipientId) => ({
      id: `notif-${Date.now()}-${recipientId}`,
      userId: recipientId,
      title,
      message,
      type,
      isRead: false,
      metadata: {},
      createdAt: new Date().toISOString()
    }));

    store.notifications.unshift(...created);
    const io = req.app.locals.io;
    created.forEach((notification) => {
      io.to(notification.userId).emit('notification:new', notification);
    });
    await req.app.locals.queue.addJob('notification-created', { recipients, notification: created[0] });
    res.status(201).json({ success: true, message: 'Notification created', data: created });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/:id/read', authenticate, (req, res) => {
  const item = store.notifications.find((notification) => notification.id === req.params.id && notification.userId === req.user.id);
  if (!item) return res.status(404).json({ success: false, message: 'Notification not found' });
  item.isRead = true;
  req.app.locals.io.to(req.user.id).emit('notification:read', { id: item.id });
  res.json({ success: true, message: 'Notification marked as read', data: item });
});

app.patch('/api/notifications/read-all', authenticate, (req, res) => {
  store.notifications.forEach((notification) => {
    if (notification.userId === req.user.id) notification.isRead = true;
  });
  req.app.locals.io.to(req.user.id).emit('notifications:all-read', { userId: req.user.id });
  res.json({ success: true, message: 'All notifications marked as read' });
});

app.delete('/api/notifications/:id', authenticate, (req, res) => {
  const index = store.notifications.findIndex((notification) => notification.id === req.params.id && notification.userId === req.user.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
  store.notifications.splice(index, 1);
  res.json({ success: true, message: 'Notification deleted' });
});

app.delete('/api/notifications', authenticate, (req, res) => {
  store.notifications = store.notifications.filter((notification) => notification.userId !== req.user.id);
  res.json({ success: true, message: 'All notifications deleted' });
});

app.use(errorHandler);

seedData(store).catch((error) => logger.error('Seeding failed', error));

module.exports = { app, server };
