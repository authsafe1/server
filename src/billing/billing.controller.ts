import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  CreateBillingDto,
  VerifyPaymentDto,
} from "src/common/dtos/billing.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { BillingService } from "./billing.service";

@UseGuards(EnsureLoginGuard)
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("create")
  async createSubscription(
    @Body() dto: CreateBillingDto,
    @Session() session: Request["session"],
  ) {
    return this.billingService.createSubscription(
      session.profile.id,
      dto.planId,
    );
  }

  @Post("verify")
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @Session() session: Request["session"],
  ) {
    return this.billingService.verifyPayment(
      dto.paymentId,
      dto.subscriptionId,
      dto.razorpaySignature,
      session.profile.id,
    );
  }

  @Put(":subscriptionId/cancel")
  async cancelSubscription(@Param("subscriptionId") subscriptionId: string) {
    return this.billingService.cancelSubscription(subscriptionId);
  }
}
