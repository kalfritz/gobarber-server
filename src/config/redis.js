export default {
  host: process.env.REDIS_CLOUD_URL ? "" : process.env.REDIS_HOST,
  port: process.env.REDIS_CLOUD_URL ? "" : process.env.REDIS_PORT,
  url: process.env.REDIS_CLOUD_URL
};
