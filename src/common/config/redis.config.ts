import { config } from "dotenv";
import { Redis } from "ioredis";

config();

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || null,
  retryStrategy: times => {
    console.log(`Redis connection lost. Retrying attempt ${times}...`);
    return Math.min(times * 100, 3000);
  },
  reconnectOnError: err => {
    console.error("Redis error:", err);
    return true;
  },
});
