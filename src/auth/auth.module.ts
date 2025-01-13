import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { LogModule } from "src/common/modules/log/log.module";
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
    LogModule,
    PassportModule.register({ defaultStrategy: "google" }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
