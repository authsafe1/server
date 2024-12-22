import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { QueueModule } from "../common/modules/queue/queue.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google.strategy";

@Module({
  imports: [
    QueueModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: "google" }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ActivityLogService, GoogleStrategy],
})
export class AuthModule {}
