import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { ApiKeyController } from "./apiKey.controller";
import { ApiKeyService } from "./apiKey.service";

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
})
export class ApiKeyModule {}
