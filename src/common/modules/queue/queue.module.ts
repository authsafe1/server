import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueName } from "../../enums/QueueName";
import { MailQueueProcessor } from "./mail.processor";

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: QueueName.MAIL,
    }),
    BullModule.registerQueue({
      name: QueueName.CLEANUP,
    }),
  ],
  providers: [MailQueueProcessor],
  exports: [BullModule],
})
export class QueueModule {}
