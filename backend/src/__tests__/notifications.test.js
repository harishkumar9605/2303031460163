const request = require('supertest');
const { app } = require('../app');

describe('Campus Hiring Notification API', () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@campus.com', password: 'password123' });
    token = res.body.data.token;
  });

  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('returns notifications for authenticated user', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('creates a notification', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New assessment', message: 'Please attend your assessment', type: 'Event' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
