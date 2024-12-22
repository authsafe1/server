import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { TwoFAController } from "./2fa.controller";
import { TwoFAService } from "./2fa.service";

@Module({
  imports: [PrismaModule],
  controllers: [TwoFAController],
  providers: [TwoFAService],
})
export class TwoFAModule {}
