export default {
  socket: process.env.REDIS_CLOUD_SOCKET,
  host: process.env.REDIS_CLOUD_HOST ? "" : process.env.REDIS_HOST,
  port: process.env.REDIS_CLOUD_PORT ? "" : process.env.REDIS_PORT
};
