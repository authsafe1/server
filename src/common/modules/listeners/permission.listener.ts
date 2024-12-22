import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Permission } from "@prisma/client";
import { AxiosService } from "../axios/axios.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PermissionEventListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly axiosService: AxiosService,
  ) {}

  private readonly logger = new Logger(PermissionEventListener.name);

  @OnEvent("permission.created")
  async handlePermissionCreated(payload: { permission: Permission }) {
    await this.triggerWebhook("permission.created", payload.permission);
  }

  @OnEvent("permission.updated")
  async handlePermissionUpdated(payload: { permission: Permission }) {
    await this.triggerWebhook("permission.updated", payload.permission);
  }

  @OnEvent("permission.deleted")
  async handlePermissionDeleted(payload: { permission: Permission }) {
    await this.triggerWebhook("permission.deleted", payload.permission);
  }

  async triggerWebhook(event: string, permission: Permission) {
    const webhooks = await this.prismaService.webhook.findMany({
      where: {
        organizationId: permission.organizationId,
        events: {
          has: event,
        },
      },
    });
    if (webhooks.length > 0) {
      webhooks.forEach(async webhook => {
        try {
          await this.axiosService.instance.post(webhook.url, {
            event,
            data: permission,
          });
          this.logger.log(
            `Webhook ${event} triggered for ${permission.id} at ${webhook.url}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to trigger webhook ${event} for ${webhook.url}: ${error.message}`,
          );
        }
      });
    }
  }
}
