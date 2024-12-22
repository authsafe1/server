import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import cacheManagerStore from "cache-manager-ioredis";
import { TwoFAModule } from "./2fa/2fa.module";
import { AuthModule } from "./auth/auth.module";
import { ClientModule } from "./client/client.module";
import { redis } from "./common/config/redis.config";
import { ErrorFilter } from "./common/filters/error.filter";
import { ListenerModule } from "./common/modules/listeners/listener.module";
import { LogModule } from "./common/modules/log/log.module";
import { PrismaModule } from "./common/modules/prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { OAuth2Module } from "./oauth2/oauth2.module";
import { OrganizationModule } from "./organization/organization.module";
import { PermissionModule } from "./permission/permission.module";
import { RoleModule } from "./role/role.module";
import { TemplateModule } from "./template/template.module";
import { UserModule } from "./user/user.module";
import { WebhookModule } from "./webhook/webhook.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      store: cacheManagerStore,
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD || undefined,
      ttl: 600 * 1000,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      storage: new ThrottlerStorageRedisService(redis),
      throttlers: [
        {
          name: "short",
          ttl: 5000,
          limit: 5,
        },
        {
          name: "medium",
          ttl: 60000,
          limit: 50,
        },
        {
          name: "long",
          ttl: 3600000,
          limit: 1000,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    TemplateModule,
    ListenerModule,
    OrganizationModule,
    UserModule,
    AuthModule,
    ClientModule,
    OAuth2Module,
    HealthModule,
    PrismaModule,
    TwoFAModule,
    PermissionModule,
    ScheduleModule,
    RoleModule,
    LogModule,
    WebhookModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
})
export class AppModule {}
