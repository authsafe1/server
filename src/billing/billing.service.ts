import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { SubscriptionStatus, SubscriptionType } from "@prisma/client";
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

  async createSubscription(
    type: "PROFESSIONAL" | "ENTERPRISE",
    profileId: string,
  ) {
    try {
      let planId = "";
      if (type === "PROFESSIONAL") {
        planId = process.env.RAZORPAY_PLAN_PROFESSIONAL;
      } else if (type === "ENTERPRISE") {
        planId = process.env.RAZORPAY_PLAN_ENTERPRISE;
      }
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        start_at: dayjs().add(1, "day").unix(),
        notes: { profileId },
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
    try {
      const generatedSignature = createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET,
      )
        .update(`${paymentId}|${subscriptionId}`)
        .digest("hex");
      const subscription =
        await this.razorpay.subscriptions.fetch(subscriptionId);

      let planType: SubscriptionType = SubscriptionType.FREE;

      if (subscription.plan_id === process.env.RAZORPAY_PLAN_PROFESSIONAL) {
        planType = SubscriptionType.PROFESSIONAL;
      } else if (
        subscription.plan_id === process.env.RAZORPAY_PLAN_ENTERPRISE
      ) {
        planType = SubscriptionType.ENTERPRISE;
      }

      if (generatedSignature === razorpaySignature) {
        await this.prismaService.subscription.update({
          where: {
            profileId,
          },
          data: {
            subscriptionId,
            type: planType,
            startDate: dayjs().add(1, "day").toDate(),
            endDate: dayjs().add(12, "months").toDate(),
            status: SubscriptionStatus.ACTIVE,
          },
        });
        return { message: "Payment verified" };
      } else {
        throw new BadRequestException("Payment failed");
      }
    } catch {
      throw new InternalServerErrorException("Payment failed");
    }
  }

  async cancelSubscription(profileId: string) {
    const subscription = await this.prismaService.subscription.findUnique({
      where: {
        profileId,
      },
    });
    await this.razorpay.subscriptions.cancel(subscription.subscriptionId);
    await this.prismaService.subscription.update({
      where: { profileId },
      data: {
        type: SubscriptionType.FREE,
        status: SubscriptionStatus.CANCELLED,
        startDate: dayjs().toDate(),
        endDate: dayjs().add(100, "years").toDate(),
        subscriptionId: `free-${profileId}`,
      },
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
