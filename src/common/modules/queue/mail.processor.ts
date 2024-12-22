import { Processor, WorkerHost } from "@nestjs/bullmq";
import { BadGatewayException, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { createTransport, SendMailOptions } from "nodemailer";
import { MailAction } from "../../enums/MailActionJob";
import { QueueName } from "../../enums/QueueName";

@Processor(QueueName.MAIL)
export class MailQueueProcessor extends WorkerHost {
  private transporter = createTransport({
    host: process.env.EMAIL_OUTGOING_SERVER,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  private readonly logger = new Logger(MailQueueProcessor.name);

  async process(job: Job<SendMailOptions>): Promise<void> {
    switch (job.name) {
      case MailAction.SEND:
        await this.sendEmail(job.data);
        this.logger.log(`Job ${job.name} triggered`);
        break;
      default:
        this.logger.warn(`Job ${job.name} not found.`);
    }
  }

  async sendEmail(options: SendMailOptions) {
    try {
      const verified = await this.transporter.verify();
      if (verified) {
        await this.transporter.sendMail({ ...options });
        this.logger.log(`Email process initiated to ${options.to}`);
      }
    } catch {
      this.logger.log("Sending Email failed");
      throw new BadGatewayException("Sending Email failed");
    }
  }
}
