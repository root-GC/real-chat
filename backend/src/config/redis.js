const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.REDIS.host,
  port: env.REDIS.port,
});

redis.on('connect', () => console.log('🔴 Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

module.exports = redis;