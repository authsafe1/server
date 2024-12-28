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
export class OrganizationSpecificCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    const organizationId = request.session?.organization?.id;
    const keyPrefix = context.getHandler().name || "cache_key";

    return `${keyPrefix}_organization_${organizationId}`;
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
    UseInterceptors(OrganizationSpecificCacheInterceptor)(
      target,
      key,
      descriptor,
    );
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
      const request: Request = args.find(
        arg => arg && arg.session && arg.session?.organization?.id,
      );
      if (!request) {
        throw new InternalServerErrorException(
          "Request or organization session data not found",
        );
      }

      const result = await originalMethod.apply(this, args);
      const organizationId = request.session?.organization?.id;
      const cacheKey = `${handlerName}_organization_${organizationId}`;

      const cacheManager = this.cacheManager as CacheType;
      await cacheManager.del(cacheKey);

      return result;
    };

    return descriptor;
  };
}
