import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { User } from "@prisma/client";
import { AxiosService } from "../axios/axios.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserEventListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly axiosService: AxiosService,
  ) {}

  private readonly logger = new Logger(UserEventListener.name);

  @OnEvent("user.created")
  async handleUserCreated(payload: { user: User }) {
    await this.triggerWebhook("user.created", payload.user);
  }

  @OnEvent("user.invited")
  async handleUserInvited(payload: { user: User }) {
    await this.triggerWebhook("user.created", payload.user);
  }

  @OnEvent("user.updated")
  async handleUserUpdated(payload: { user: User }) {
    await this.triggerWebhook("user.updated", payload.user);
  }

  @OnEvent("user.role.assigned")
  async handleUserRoleAssigned(payload: { user: User }) {
    await this.triggerWebhook("user.role.assigned", payload.user);
  }

  @OnEvent("user.deleted")
  async handleUserDeleted(payload: { user: User }) {
    await this.triggerWebhook("user.deleted", payload.user);
  }

  async triggerWebhook(event: string, user: User) {
    const webhooks = await this.prismaService.webhook.findMany({
      where: {
        organizationId: user.organizationId,
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
            data: user,
          });
          this.logger.log(
            `Webhook ${event} triggered for ${user.id} at ${webhook.url}`,
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
