import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Client, Prisma } from "@prisma/client";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class ClientService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async clients(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ClientWhereUniqueInput;
      where?: Prisma.ClientWhereInput;
      orderBy?: Prisma.ClientOrderByWithRelationInput;
    },
    organizationId: string,
  ) {
    const { where, ...paramsWithoutWhere } = params;
    try {
      return await this.prismaService.client.findMany({
        ...paramsWithoutWhere,
        where: {
          organizationId,
          ...where,
        },
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException("Client not found");
      }
      throw new InternalServerErrorException();
    }
  }

  async client(where: Prisma.ClientWhereUniqueInput): Promise<Client> {
    try {
      return await this.prismaService.client.findUniqueOrThrow({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async createClient(
    clientData: Omit<Prisma.ClientCreateInput, "Organization">,
    organizationId: string,
  ): Promise<Client> {
    try {
      if (!organizationId) {
        throw new Error("MISSING_ORGANIZATIONID");
      }
      const client = await this.prismaService.client.create({
        data: {
          name: clientData.name,
          redirectUri: clientData.redirectUri,
          grant: clientData.grant,
          Organization: {
            connect: {
              id: organizationId,
            },
          },
        },
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        client.Organization.profileId,
        "New client created",
      );
      await this.eventEmitter.emitAsync("application.created", { client });
      return client;
    } catch (err) {
      if (err.message === "MISSING_ORGANIZATIONID") {
        throw new UnauthorizedException("Organization Id missing");
      }
      throw new InternalServerErrorException();
    }
  }

  async updateClient(params: {
    where: Prisma.ClientWhereUniqueInput;
    data: Prisma.ClientUpdateInput;
  }): Promise<Client> {
    const { where, data } = params;
    try {
      const client = await this.prismaService.client.update({
        data,
        where,
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        client.Organization.profileId,
        "Client updated",
      );
      await this.eventEmitter.emitAsync("application.updated", { client });
      return client;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async deleteClient(where: Prisma.ClientWhereUniqueInput): Promise<Client> {
    try {
      const client = await this.prismaService.client.delete({
        where,
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        client.Organization.profileId,
        "Client deleted",
      );
      await this.eventEmitter.emitAsync("application.deleted", { client });
      return client;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async countClients(where: Prisma.ClientWhereInput) {
    try {
      return await this.prismaService.client.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
