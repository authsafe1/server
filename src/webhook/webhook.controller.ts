import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhooksDto,
} from "../common/dtos/webhook.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { WebhookService } from "./webhook.service";

@UseGuards(EnsureLoginGuard)
@Controller("webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post("create")
  async createWebhook(
    @Body() dto: CreateWebhookDto,
    @Session() session: Request["session"],
  ) {
    await this.webhookService.createWebhook(dto, session?.organization?.id);
  }

  @Post("all")
  async findAll(
    @Body() dto: WebhooksDto,
    @Session() session: Request["session"],
  ) {
    return this.webhookService.getAllWebhooks(dto, session?.organization?.id);
  }

  @Get("count")
  async countWebhooks(@Session() session: Request["session"]) {
    return this.webhookService.countWebhooks({
      organizationId: session?.organization?.id,
    });
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return this.webhookService.getWebhookById(id, session?.organization.id);
  }

  @Put("update/:id")
  async update(@Param("id") id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.updateWebhook(id, dto);
  }

  @Delete("delete/:id")
  async remove(@Param("id") id: string) {
    return this.webhookService.deleteWebhook(id);
  }
}
