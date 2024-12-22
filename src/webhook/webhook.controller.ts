import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
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
  async createWebhook(@Body() dto: CreateWebhookDto, @Req() req: Request) {
    await this.webhookService.createWebhook({
      ...dto,
      Organization: {
        connect: { id: req.session?.organization?.id },
      },
    });
  }

  @Post("all")
  async findAll(@Body() dto: WebhooksDto) {
    return this.webhookService.getAllWebhooks(dto);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.webhookService.getWebhookById(id);
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
