import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/modules/prisma/prisma.module";
import { BillingWebhookController } from "./billing-webhook.controller";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService],
})
export class BillingModule {}
