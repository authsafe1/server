import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Client } from "@prisma/client";
import { AxiosService } from "../axios/axios.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClientEventListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly axiosService: AxiosService,
  ) {}

  private readonly logger = new Logger(ClientEventListener.name);

  @OnEvent("application.created")
  async handleClientCreated(payload: { client: Client }) {
    await this.triggerWebhook("application.created", payload.client);
  }

  @OnEvent("application.updated")
  async handleClientUpdated(payload: { client: Client }) {
    await this.triggerWebhook("application.updated", payload.client);
  }

  @OnEvent("application.deleted")
  async handleClientDeleted(payload: { client: Client }) {
    await this.triggerWebhook("application.updated", payload.client);
  }

  async triggerWebhook(event: string, client: Client) {
    const webhooks = await this.prismaService.webhook.findMany({
      where: {
        organizationId: client.organizationId,
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
            data: client,
          });
          this.logger.log(
            `Webhook ${event} triggered for ${client.id} at ${webhook.url}`,
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
