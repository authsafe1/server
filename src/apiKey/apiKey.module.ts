import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { ApiKeyController } from "./apiKey.controller";
import { ApiKeyService } from "./apiKey.service";

@Module({
  imports: [PrismaModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
})
export class ApiKeyModule {}
