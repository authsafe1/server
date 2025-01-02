import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { OAuth2Controller } from "./oauth2.controller";
import { OAuth2Service } from "./oauth2.service";

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [OAuth2Controller],
  providers: [OAuth2Service],
})
export class OAuth2Module {}
