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
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { BillingService } from "./billing.service";

@UseGuards(EnsureLoginGuard)
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("create")
  async createSubscription(
    @Body() body: { planId: string; amount: number },
    @Session() session: Request["session"],
  ) {
    return this.billingService.createSubscription(
      session.profile.id,
      body.planId,
      body.amount,
    );
  }

  @Put(":subscriptionId/cancel")
  async cancelSubscription(@Param("subscriptionId") subscriptionId: string) {
    return this.billingService.cancelSubscription(subscriptionId);
  }
}
