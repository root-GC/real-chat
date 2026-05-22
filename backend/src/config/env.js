module.exports = {
  PORT: process.env.PORT || 3000,
  DB: {
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },
  REDIS: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  JWT_SECRET: process.env.JWT_SECRET,
};