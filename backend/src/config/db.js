const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool(env.DB);

module.exports = pool;