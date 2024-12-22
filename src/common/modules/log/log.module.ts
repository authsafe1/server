import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ActivityLogService } from "./activity-log.service";
import { AuthorizationLogService } from "./authorization-log.service";
import { SecurityAlertService } from "./security-log.service";

@Module({
  imports: [PrismaModule],
  providers: [
    AuthorizationLogService,
    ActivityLogService,
    SecurityAlertService,
  ],
  exports: [AuthorizationLogService, ActivityLogService, SecurityAlertService],
})
export class LogModule {}
