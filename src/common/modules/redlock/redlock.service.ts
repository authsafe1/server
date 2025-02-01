import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Redis } from "ioredis";
import Redlock, { ExecutionError, Lock, ResourceLockedError } from "redlock";
import { redis } from "../../../common/config/redis.config";

@Injectable()
export class RedlockService implements OnModuleInit, OnModuleDestroy {
  private redlock: Redlock;
  private readonly logger = new Logger(RedlockService.name);
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = redis;

    this.redlock = new Redlock([this.redisClient], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });

    this.redisClient.on("error", err => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.redisClient.on("connect", () => {
      this.logger.log("Connected to Redis");
    });
    this.redisClient
      .ping()
      .then(result => {
        this.logger.log(`Redis ping result: ${result}`);
      })
      .catch(err => {
        this.logger.error(`Redis ping failed: ${err}`);
      });
  }

  /**
   * Acquire a distributed lock on a resource.
   * @param resource - The resource to lock, e.g., 'locks:refresh_token:123'.
   * @param ttl - The time-to-live for the lock in milliseconds.
   * @returns A promise that resolves to the lock object.
   */
  async acquireLock(resource: string, ttl: number = 5000) {
    try {
      const lock = await this.redlock.acquire([resource], ttl);
      this.logger.log(`Lock acquired on resource: ${resource}`);
      return lock;
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        this.logger.error(`Resource ${resource} is already locked.`);
        throw new Error(
          `Failed to acquire lock on resource: ${resource}. Resource is already locked.`,
        );
      } else if (error instanceof ExecutionError) {
        this.logger.error(
          `Failed to execute locking logic for resource ${resource}.`,
        );
        throw new Error(
          `Failed to acquire lock on resource: ${resource}. Execution failed.`,
        );
      } else {
        this.logger.error(
          `Unexpected error while acquiring lock on resource: ${resource}`,
          error,
        );
        throw new Error(
          `Failed to acquire lock on resource: ${resource}. Unexpected error.`,
        );
      }
    }
  }

  /**
   * Release a distributed lock.
   * @param lock - The lock object to release.
   */
  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
      this.logger.log(`Lock released on resource: ${lock.resources.join()}`);
    } catch (error) {
      if (error instanceof ExecutionError) {
        this.logger.error(
          `Failed to release lock on resource: ${lock.resources.join()}.`,
        );
      } else {
        this.logger.error(
          `Unexpected error while releasing lock on resource: ${lock.resources.join()}`,
          error,
        );
      }
    }
  }

  /**
   * Extend the lock's time-to-live.
   * @param lock - The lock object to extend.
   * @param ttl - The new time-to-live for the lock in milliseconds.
   */
  async extendLock(lock: Lock, ttl: number): Promise<Lock> {
    try {
      const extendedLock = await lock.extend(ttl);
      this.logger.log(
        `Lock extended on resource: ${lock.resources} for ${ttl}ms`,
      );
      return extendedLock;
    } catch (error) {
      if (error instanceof ExecutionError) {
        this.logger.error(
          `Failed to extend lock on resource: ${lock.resources.join()}.`,
        );
        throw new Error(
          `Failed to extend lock on resource: ${lock.resources.join()}. Execution failed.`,
        );
      } else {
        this.logger.error(
          `Unexpected error while extending lock on resource: ${lock.resources.join()}`,
          error,
        );
        throw new Error(
          `Failed to extend lock on resource: ${lock.resources.join()}. Unexpected error.`,
        );
      }
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log("Redis client connection closed.");
      }
    } catch (err) {
      this.logger.error("Error while closing Redis client connection", err);
    }
  }
}
