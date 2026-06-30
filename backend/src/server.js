const { server } = require('./app');
const logger = require('./config/logger');

const port = process.env.PORT || 5000;
server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
