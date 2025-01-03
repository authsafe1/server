import { Module } from "@nestjs/common";
import { PrismaModule } from "src/common/modules/prisma/prisma.module";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";

@Module({
  imports: [PrismaModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
