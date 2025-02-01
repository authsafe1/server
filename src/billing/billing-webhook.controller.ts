import { Controller, Logger, Post, Req } from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
import { Request } from "express";
import { BillingService } from "./billing.service";

@Controller("billing/webhook")
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post()
  async handleWebhook(@Req() req: Request) {
    const event = req.body;
    this.logger.log(`Received webhook: ${event.event}`);

    if (event.event === "subscription.activated") {
      await this.billingService.updateSubscriptionStatus(
        event.payload.subscription.entity.id,
        SubscriptionStatus.ACTIVE,
      );
    } else if (event.event === "subscription.cancelled") {
      await this.billingService.updateSubscriptionStatus(
        event.payload.subscription.entity.id,
        SubscriptionStatus.CANCELLED,
      );
    } else if (event.event === "invoice.paid") {
      await this.billingService.updateSubscriptionStatus(
        event.payload.subscription.entity.id,
        SubscriptionStatus.ACTIVE,
      );
    } else if (event.event === "invoice.payment_failed") {
      await this.billingService.updateSubscriptionStatus(
        event.payload.subscription.entity.id,
        SubscriptionStatus.PAST_DUE,
      );
    }

    return { message: "success" };
  }
}
