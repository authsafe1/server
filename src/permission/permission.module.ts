import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { PermissionController } from "./permission.controller";
import { PermissionService } from "./permission.service";

@Module({
  imports: [PrismaModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
