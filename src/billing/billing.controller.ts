import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Inject,
  Post,
  Put,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Cache } from "cache-manager";
import { Request } from "express";
import {
  CreateBillingDto,
  VerifyPaymentDto,
} from "src/common/dtos/billing.dto";
import { CacheInvalidate } from "../common/decorators/cache.decorator";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @UseGuards(EnsureLoginGuard)
  @Post("create")
  async createSubscription(
    @Body() dto: CreateBillingDto,
    @Session() session: Request["session"],
  ) {
    return this.billingService.createSubscription(
      dto.type,
      session?.profile?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("verify")
  @CacheInvalidate("isAuthenticated")
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @Session() session: Request["session"],
  ) {
    return this.billingService.verifyPayment(
      dto.paymentId,
      dto.subscriptionId,
      dto.razorpaySignature,
      session?.profile?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Put("cancel")
  @CacheInvalidate("isAuthenticated")
  async cancelSubscription(@Session() session: Request["session"]) {
    return this.billingService.cancelSubscription(session?.profile?.id);
  }
}
