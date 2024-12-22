import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LogModule } from "../common/modules/log/log.module";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { RedlockModule } from "../common/modules/redlock/redlock.module";
import { OAuth2Controller } from "./oauth2.controller";
import { OAuth2Service } from "./oauth2.service";

@Module({
  imports: [PrismaModule, RedlockModule, LogModule, JwtModule.register({})],
  controllers: [OAuth2Controller],
  providers: [OAuth2Service],
})
export class OAuth2Module {}
