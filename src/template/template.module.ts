import { Module } from "@nestjs/common";
import { LogModule } from "../common/modules/log/log.module";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { TemplateController } from "./template.controller";
import { TemplateService } from "./template.service";

@Module({
  imports: [PrismaModule, LogModule],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
