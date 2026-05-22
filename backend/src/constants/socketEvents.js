// Re-exporta os mesmos eventos definidos em sockets/events.js
// para que outras camadas possam importar sem saber de sockets.
module.exports = require('../modules/sockets/events');