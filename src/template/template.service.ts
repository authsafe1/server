import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class TemplateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async templates(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.EmailTemplateWhereUniqueInput;
      where?: Prisma.EmailTemplateWhereInput;
      orderBy?: Prisma.EmailTemplateOrderByWithRelationInput;
    },
    organizationId: string,
  ) {
    const { where, ...paramsWithoutWhere } = params;
    try {
      return await this.prismaService.emailTemplate.findMany({
        ...paramsWithoutWhere,
        where: {
          organizationId,
          ...where,
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async template(where: Prisma.EmailTemplateWhereUniqueInput) {
    try {
      return this.prismaService.emailTemplate.findUniqueOrThrow({
        where,
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException();
      }
      throw new InternalServerErrorException();
    }
  }

  async createTemplate(
    organizationId: string,
    data: Omit<Prisma.EmailTemplateCreateInput, "Organization">,
  ) {
    try {
      const template = await this.prismaService.emailTemplate.create({
        data: {
          ...data,
          Organization: {
            connect: { id: organizationId },
          },
        },
      });
      await this.activityLogService.logActivity(
        organizationId,
        "Email Template created",
      );
      await this.eventEmitter.emitAsync("template.created", { template });
      return template;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async updateTemplate(
    where: Prisma.EmailTemplateWhereUniqueInput,
    data: Omit<Prisma.EmailTemplateUpdateInput, "Organization">,
  ) {
    try {
      const template = await this.prismaService.emailTemplate.update({
        where,
        data,
      });
      await this.activityLogService.logActivity(
        template.organizationId,
        "Email Template updated",
      );
      await this.eventEmitter.emitAsync("template.updated", { template });
      return template;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async deleteTemplate(where: Prisma.EmailTemplateWhereUniqueInput) {
    try {
      const template = await this.prismaService.emailTemplate.delete({
        where,
      });
      await this.activityLogService.logActivity(
        template.organizationId,
        "Email Template deleted",
      );
      await this.eventEmitter.emitAsync("template.deleted", { template });
      return template;
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
