import { Injectable, Logger } from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
import dayjs from "dayjs";
import Razorpay from "razorpay";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class BillingService {
  private readonly razorpay: Razorpay;
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prismaService: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createSubscription(profileId: string, planId: string, amount: number) {
    const subscription = await this.razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      start_at: dayjs().add(1, "day").unix(),
      notes: { user: profileId },
    });

    const newSubscription = await this.prismaService.subscription.create({
      data: {
        profileId,
        subscriptionId: subscription.id,
        amount: amount,
        status: SubscriptionStatus.CANCELLED,
        startDate: dayjs().toDate(),
        endDate: dayjs().add(12, "months").toDate(),
      },
    });

    return { subscription, newSubscription };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.razorpay.subscriptions.cancel(subscriptionId);
    await this.prismaService.subscription.updateMany({
      where: { subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    return { success: true, message: "Subscription cancelled" };
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ) {
    await this.prismaService.subscription.updateMany({
      where: { subscriptionId },
      data: { status },
    });
    this.logger.log(`Subscription ${subscriptionId} updated to ${status}`);
  }
}
