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

  async createWebhook(data: Prisma.WebhookCreateInput) {
    try {
      return await this.prismaService.webhook.create({
        data,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllWebhooks(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.WebhookWhereUniqueInput;
    where?: Prisma.WebhookWhereInput;
    orderBy?: Prisma.WebhookOrderByWithRelationInput;
  }) {
    return this.prismaService.webhook.findMany({
      ...params,
    });
  }

  async getWebhookById(id: string) {
    try {
      return await this.prismaService.webhook.findUniqueOrThrow({
        where: { id },
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
