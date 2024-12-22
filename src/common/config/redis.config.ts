import { config } from "dotenv";
import { Redis } from "ioredis";

config();

export const redis = new Redis(
  Number(process.env.REDIS_PORT),
  process.env.REDIS_HOST,
  { password: process.env.REDIS_PASSWORD },
);
