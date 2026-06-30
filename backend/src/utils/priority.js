const WEIGHT_MAP = {
  Placement: 100,
  Result: 70,
  Event: 40,
  Interview: 60,
  Reminder: 25,
  System: 30
};

function calculatePriorityScore(notification) {
  const createdAt = new Date(notification.createdAt).getTime();
  const now = Date.now();
  const ageHours = Math.max(1, (now - createdAt) / (1000 * 60 * 60));
  const recencyBoost = Math.max(0, 100 - ageHours * 2);
  return WEIGHT_MAP[notification.type] + recencyBoost;
}

function getTopPriorityNotifications(notifications, top = 10) {
  return [...notifications]
    .map((notification) => ({ ...notification, priorityScore: calculatePriorityScore(notification) }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, top);
}

module.exports = { getTopPriorityNotifications };
