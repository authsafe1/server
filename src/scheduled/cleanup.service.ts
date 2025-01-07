import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Cron, Interval } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { CleanupAction } from "../common/enums/CleanupActionJob";
import { QueueName } from "../common/enums/QueueName";

@Injectable()
export class CleanupService {
  constructor(
    @InjectQueue(QueueName.CLEANUP) private readonly cleanupQueue: Queue,
  ) {}

  @Cron("0 0 0 */7 * *")
  async clearExpiredTokens() {
    await this.cleanupQueue.add(CleanupAction.EXPIRED_TOKEN, {});
  }

  @Interval(60 * 60 * 1000)
  async clearPasswordResetToken() {
    await this.cleanupQueue.add(CleanupAction.PASSWORD_RESET_TOKEN, {});
  }

  @Cron("0 0 0 */7 * *")
  async clearUnverifiedOrganizations() {
    await this.cleanupQueue.add(CleanupAction.UNVERIFIED_ORGANIZATIONS, {});
  }

  @Interval(6 * 60 * 60 * 1000)
  async clearUnverifiedUsers() {
    await this.cleanupQueue.add(CleanupAction.UNVERIFIED_USERS, {});
  }

  @Interval(6 * 60 * 60 * 1000)
  async clearExpiredApiKeys() {
    await this.cleanupQueue.add(CleanupAction.EXPIRED_API_KEY, {});
  }

  @Cron("0 0 * * *")
  async clearOldLogs() {
    await this.cleanupQueue.add(CleanupAction.OLD_LOGS, {});
  }
}
