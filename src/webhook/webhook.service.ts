import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class WebhookService {
  constructor(private readonly prismaService: PrismaService) {}

  async createWebhook(
    data: Omit<Prisma.WebhookCreateInput, "organizationId" | "Organization">,
    organizationId: string,
  ) {
    try {
      return await this.prismaService.webhook.create({
        data: {
          ...data,
          Organization: {
            connect: {
              id: organizationId,
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllWebhooks(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.WebhookWhereUniqueInput;
      where?: Prisma.WebhookWhereInput;
      orderBy?: Prisma.WebhookOrderByWithRelationInput;
    },
    organizationId: string,
  ) {
    const { where, ...paramsWithoutWhere } = params;
    return this.prismaService.webhook.findMany({
      where: {
        ...where,
        organizationId,
      },
      ...paramsWithoutWhere,
    });
  }

  async getWebhookById(id: string, organizationId: string) {
    try {
      return await this.prismaService.webhook.findUniqueOrThrow({
        where: { id, organizationId },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Webhook with ID ${id} not found`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async countWebhooks(where: Prisma.WebhookWhereInput) {
    try {
      return await this.prismaService.webhook.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async updateWebhook(id: string, data: Prisma.WebhookUpdateInput) {
    const webhook = await this.prismaService.webhook.findUnique({
      where: { id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }
    return this.prismaService.webhook.update({
      where: { id },
      data,
    });
  }

  async deleteWebhook(id: string) {
    const webhook = await this.prismaService.webhook.findUnique({
      where: { id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }
    return this.prismaService.webhook.delete({
      where: { id },
    });
  }
}
