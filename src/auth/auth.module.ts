import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { QueueModule } from "../common/modules/queue/queue.module";
import { StrategyModule } from "../common/modules/strategy/strategy.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    QueueModule,
    PrismaModule,
    StrategyModule,
    PassportModule.register({ defaultStrategy: "google" }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ActivityLogService],
})
export class AuthModule {}
