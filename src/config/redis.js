/*export default {
  host: process.env.REDIS_CLOUD_HOST || process.env.REDIS_HOST,
  port: process.env.REDIS_CLOUD_PORT || process.env.REDIS_PORT,
  password: process.env.REDIS_CLOUD_PASS,
  auth_pass: process.env.REDIS_CLOUD_PASS
};*/

import redis from "redis";

const client = redis.createClient({
  host: process.env.REDIS_CLOUD_HOST || process.env.REDIS_HOST,
  port: process.env.REDIS_CLOUD_PORT || process.env.REDIS_PORT
});
if (process.env.REDIS_CLOUD_PASS) {
  client.auth(process.env.REDIS_CLOUD_PASS);
}

export default client;
