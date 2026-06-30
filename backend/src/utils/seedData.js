const bcrypt = require('bcryptjs');

async function seedData(store) {
  const existing = store.users.find((u) => u.email === 'admin@campus.com');
  if (!existing) {
    const passwordHash = await bcrypt.hash('password123', 10);
    store.users.push({
      id: 'user-admin',
      email: 'admin@campus.com',
      passwordHash,
      name: 'Admin User',
      role: 'admin'
    });
    store.users.push({
      id: 'user-student-1',
      email: 'student1@campus.com',
      passwordHash,
      name: 'Ravi Kumar',
      role: 'student'
    });
    store.users.push({
      id: 'user-student-2',
      email: 'student2@campus.com',
      passwordHash,
      name: 'Meera Nair',
      role: 'student'
    });
  }

  if (store.notifications.length === 0) {
    const now = new Date();
    store.notifications.push(
      {
        id: 'notif-1',
        userId: 'user-student-1',
        title: 'Placement Drive Scheduled',
        message: 'A placement drive has been scheduled for 15 July 2026.',
        type: 'Placement',
        isRead: false,
        metadata: { campaignId: 'cmp-1' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'user-student-1',
        title: 'Result Published',
        message: 'Your result has been published.',
        type: 'Result',
        isRead: false,
        metadata: { resultId: 'res-1' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'notif-3',
        userId: 'user-student-2',
        title: 'Campus Event Reminder',
        message: 'A campus event is scheduled for tomorrow.',
        type: 'Event',
        isRead: true,
        metadata: { eventId: 'evt-1' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString()
      }
    );
  }
}

module.exports = { seedData };
