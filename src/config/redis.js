export default {
  host: process.env.REDIS_CLOUD_HOST || process.env.REDIS_HOST,
  port: process.env.REDIS_CLOUD_PORT || process.env.REDIS_PORT
};
