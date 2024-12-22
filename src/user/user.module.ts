import { Module } from "@nestjs/common";
import { LogModule } from "../common/modules/log/log.module";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { QueueModule } from "../common/modules/queue/queue.module";
import { RedlockModule } from "../common/modules/redlock/redlock.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [QueueModule, RedlockModule, PrismaModule, LogModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
