import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GoogleStrategy } from "./google.strategy";

@Module({
  imports: [PrismaModule],
  providers: [GoogleStrategy],
  exports: [GoogleStrategy],
})
export class StrategyModule {}
