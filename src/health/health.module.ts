import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: "pretty",
      gracefulShutdownTimeoutMs: 1000,
    }),
    HttpModule,
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
