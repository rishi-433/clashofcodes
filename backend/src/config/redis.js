const Redis = require('ioredis');

// Ensure you have REDIS_URL or use a default
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    commandTimeout: 5000
});

redisClient.on('connect', () => {
    console.log('Redis connected via ioredis');
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

module.exports = redisClient;