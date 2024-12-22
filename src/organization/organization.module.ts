import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../common/modules/cloudinary/cloudinary.module";
import { LogModule } from "../common/modules/log/log.module";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { QueueModule } from "../common/modules/queue/queue.module";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

@Module({
  imports: [PrismaModule, LogModule, QueueModule, CloudinaryModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
