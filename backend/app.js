const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./src/modules/auth/auth.routes');
const messageRoutes  = require('./src/modules/messages/messages.routes');
const usersRoutes    = require('./src/modules/users/users.routes');
const groupsRoutes   = require('./src/modules/groups/groups.routes');  // ← novo
const errorHandler   = require('./src/middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas REST
app.use('/api/users',    usersRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups',   groupsRoutes);  // ← novo

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Middleware de erro (sempre no fim)
app.use(errorHandler);

module.exports = app;