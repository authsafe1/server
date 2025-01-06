import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { QueueModule } from "../common/modules/queue/queue.module";
import { CleanupService } from "./cleanup.service";

@Module({
  imports: [
    QueueModule,
    HttpModule.register({
      timeout: 15 * 1000,
    }),
  ],
  providers: [CleanupService],
})
export class ScheduleModule {}
