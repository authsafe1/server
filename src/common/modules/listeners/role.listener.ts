import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Role } from "@prisma/client";
import { AxiosService } from "../axios/axios.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RoleEventListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly axiosService: AxiosService,
  ) {}

  private readonly logger = new Logger(RoleEventListener.name);

  @OnEvent("role.created")
  async handleRoleCreated(payload: { role: Role }) {
    await this.triggerWebhook("role.created", payload.role);
  }

  @OnEvent("organization.updated")
  async handleRoleUpdated(payload: { role: Role }) {
    await this.triggerWebhook("role.updated", payload.role);
  }

  @OnEvent("role.deleted")
  async handleRoleDeleted(payload: { role: Role }) {
    await this.triggerWebhook("role.deleted", payload.role);
  }

  async triggerWebhook(event: string, role: Role) {
    const webhooks = await this.prismaService.webhook.findMany({
      where: {
        organizationId: role.organizationId,
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
            data: role,
          });
          this.logger.log(
            `Webhook ${event} triggered for ${role.id} at ${webhook.url}`,
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
