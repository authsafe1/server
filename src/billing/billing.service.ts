import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
import { createHmac } from "crypto";
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

  async createSubscription(profileId: string, planId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        start_at: dayjs().add(1, "day").unix(),
        notes: { profileId },
      });

      await this.prismaService.subscription.create({
        data: {
          subscriptionId: subscription.id,
          status: SubscriptionStatus.INCOMPLETE,
          startDate: dayjs().add(1, "day").toDate(),
          endDate: dayjs().add(12, "months").toDate(),
          Profile: {
            connect: {
              id: profileId,
            },
          },
        },
      });

      return { subscriptionId: subscription.id };
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async verifyPayment(
    paymentId: string,
    subscriptionId: string,
    razorpaySignature: string,
    profileId: string,
  ) {
    const generatedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET,
    )
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");
    if (generatedSignature === razorpaySignature) {
      await this.prismaService.subscription.update({
        where: {
          subscriptionId,
          profileId,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });
      return { message: "Payment verified" };
    } else {
      throw new UnauthorizedException("Payment failed");
    }
  }

  async cancelSubscription(subscriptionId: string) {
    await this.razorpay.subscriptions.cancel(subscriptionId);
    await this.prismaService.subscription.update({
      where: { subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    return { success: true, message: "Subscription cancelled" };
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ) {
    await this.prismaService.subscription.update({
      where: { subscriptionId },
      data: { status },
    });
    this.logger.log(`Subscription ${subscriptionId} updated to ${status}`);
  }
}
