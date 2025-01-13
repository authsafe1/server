import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../common/modules/cloudinary/cloudinary.module";
import { LogModule } from "../common/modules/log/log.module";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { QueueModule } from "../common/modules/queue/queue.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [PrismaModule, QueueModule, CloudinaryModule, LogModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
