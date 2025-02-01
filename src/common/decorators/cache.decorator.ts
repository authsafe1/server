import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UseInterceptors,
} from "@nestjs/common";
import { Cache as CacheType } from "cache-manager";
import { Request } from "express";

@Injectable()
export class ProfileSpecificCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    const profileId = request.session?.profile?.id;
    const keyPrefix = context.getHandler().name || "cache_key";

    return `${keyPrefix}_profile_${profileId}`;
  }
}

/**
 * Custom caching decorator to enable organization-specific caching with a custom TTL.
 *
 * @param {number} ttlSeconds - The time-to-live for the cache, in seconds.
 * @returns {MethodDecorator} - A method decorator that applies organization-specific caching.
 */
export function Cache(ttlSeconds: number): MethodDecorator {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    UseInterceptors(ProfileSpecificCacheInterceptor)(target, key, descriptor);
    CacheTTL(ttlSeconds * 1000)(target, key, descriptor);
  };
}

/**
 * Decorator to invalidate a specific cache entry based on the handler and user/organization context.
 *
 * @param {string} handlerName - Name of the handler to use as a cache key prefix.
 * @returns {MethodDecorator} - A method decorator to invalidate the cache for a specific key.
 */
export function CacheInvalidate(handlerName: string): MethodDecorator {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let request: Request | Partial<Request> | undefined;

      // Find Request in arguments if it's provided via @Req()
      const reqArg = args.find(
        arg => arg instanceof Object && "session" in arg,
      );

      if (reqArg) {
        request = reqArg as Request; // Found a full request object
      } else {
        // If @Session() is used, reconstruct the necessary part of the Request object
        const session = args.find(arg => arg?.profile?.id);
        if (session) {
          request = { session } as Partial<Request>;
        }
      }

      if (!request || !request.session?.profile?.id) {
        throw new InternalServerErrorException(
          "Request or session data not found",
        );
      }

      const profileId = request.session.profile.id;
      const cacheKey = `${handlerName}_profile_${profileId}`;

      const cacheManager = this.cacheManager as CacheType;
      await cacheManager.del(cacheKey);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
