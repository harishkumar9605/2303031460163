const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

let queue;
let worker;

function createQueueService() {
  if (!process.env.REDIS_URL) {
    return { addJob: async () => ({ id: 'mock-job' }), processJobs: async () => {} };
  }

  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  queue = new Queue('notification-jobs', { connection });
  worker = new Worker('notification-jobs', async (job) => {
    console.log('Processing job', job.id);
  }, { connection });

  return {
    addJob: async (name, data) => queue.add(name, data),
    processJobs: async () => worker
  };
}

module.exports = { createQueueService };
