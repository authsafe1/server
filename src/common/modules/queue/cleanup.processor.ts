import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import dayjs from "dayjs";
import { CleanupAction } from "../../enums/CleanupActionJob";
import { QueueName } from "../../enums/QueueName";
import { PrismaService } from "../prisma/prisma.service";

@Processor(QueueName.CLEANUP)
export class CleanupQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      switch (job.name) {
        case CleanupAction.EXPIRED_TOKEN:
          await this.clearExpiredTokens();
          break;
        case CleanupAction.PASSWORD_RESET_TOKEN:
          await this.clearPasswordResetTokens();
          break;
        case CleanupAction.UNVERIFIED_ORGANIZATIONS:
          await this.clearUnverifiedOrganizations();
          break;
        case CleanupAction.UNVERIFIED_USERS:
          await this.clearUnverifiedUsers();
          break;
        case CleanupAction.OLD_LOGS:
          await this.clearOldLogs();
          break;
        default:
          this.logger.warn(`Job ${job.name} not found.`);
      }
      this.logger.log(`Cleanup action ${job.name} processed successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to process cleanup action ${job.name}: ${error.message}`,
      );
    }
  }

  private async clearExpiredTokens() {
    const now = new Date();
    const refreshTokenResult = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    this.logger.log(
      `Expired refresh tokens cleared: ${refreshTokenResult.count}`,
    );
  }

  private async clearPasswordResetTokens() {
    const now = new Date();
    const passwordResetToken = await this.prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    this.logger.log(
      `Password reset tokens cleared: ${passwordResetToken.count}`,
    );
  }

  private async clearUnverifiedOrganizations() {
    const tenDaysAgo = dayjs().subtract(10, "days").toDate();
    const tempUser = await this.prisma.organization.deleteMany({
      where: {
        AND: [{ isVerified: false }, { createdAt: { lte: tenDaysAgo } }],
      },
    });
    this.logger.log(`Unverified organizations cleared: ${tempUser.count}`);
  }

  private async clearUnverifiedUsers() {
    const tempUser = await this.prisma.user.deleteMany({
      where: { isVerified: false },
    });
    this.logger.log(`Unverified organizations cleared: ${tempUser.count}`);
  }

  private async clearOldLogs() {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const activityLog = await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: sixtyDaysAgo } },
    });
    const authorizationLog = await this.prisma.authorizationLog.deleteMany({
      where: { createdAt: { lt: sixtyDaysAgo } },
    });
    this.logger.log(`Activity logs cleared: ${activityLog.count}`);
    this.logger.log(`Authorization logs cleared: ${authorizationLog.count}`);
  }
}
