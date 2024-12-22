import { Module } from "@nestjs/common";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { ClientController } from "./client.controller";
import { ClientService } from "./client.service";

@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [ClientService, ActivityLogService],
})
export class ClientModule {}
