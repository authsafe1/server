import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { BrandingController } from "./branding.controller";
import { BrandingService } from "./branding.service";

@Module({
  imports: [PrismaModule],
  controllers: [BrandingController],
  providers: [BrandingService],
})
export class BrandingModule {}
