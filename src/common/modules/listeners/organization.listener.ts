import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Organization } from "@prisma/client";
import { AxiosService } from "../axios/axios.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationEventListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly axiosService: AxiosService,
  ) {}

  private readonly logger = new Logger(OrganizationEventListener.name);

  @OnEvent("organization.created")
  async handleOrganizationCreated(payload: { organization: Organization }) {
    await this.triggerWebhook("organization.created", payload.organization);
  }

  @OnEvent("organization.verified")
  async handleOrganizationVerified(payload: { organization: Organization }) {
    await this.triggerWebhook("organization.verified", payload.organization);
  }

  @OnEvent("organization.updated")
  async handleOrganizationUpdated(payload: { organization: Organization }) {
    await this.triggerWebhook("organization.updated", payload.organization);
  }

  @OnEvent("organization.deleted")
  async handleOrganizationDeleted(payload: { organization: Organization }) {
    await this.triggerWebhook("organization.deleted", payload.organization);
  }

  @OnEvent("organization.photo.updated")
  async handleOrganizationPhotoUpdated(payload: {
    organization: Organization;
  }) {
    await this.triggerWebhook(
      "organization.photo.updated",
      payload.organization,
    );
  }

  async triggerWebhook(event: string, organization: Organization) {
    const webhooks = await this.prismaService.webhook.findMany({
      where: {
        organizationId: organization.id,
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
            data: organization,
          });
          this.logger.log(
            `Webhook ${event} triggered for ${organization.id} at ${webhook.url}`,
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
