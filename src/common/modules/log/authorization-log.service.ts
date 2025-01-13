import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthorizationLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async logAuthorization(
    userId: string,
    clientId: string,
    profileId: string,
    action: string,
    ip?: string,
  ) {
    return await this.prismaService.authorizationLog.create({
      data: {
        action,
        ip,
        User: { connect: { id: userId } },
        Client: { connect: { id: clientId } },
        Profile: { connect: { id: profileId } },
      },
    });
  }

  async countAuthorizationLogs(where: Prisma.AuthorizationLogWhereInput) {
    try {
      return await this.prismaService.authorizationLog.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllAuthorizationLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AuthorizationLogWhereUniqueInput;
    where?: Prisma.AuthorizationLogWhereInput;
    orderBy?: Prisma.AuthorizationLogOrderByWithRelationInput;
  }) {
    return await this.prismaService.authorizationLog.findMany({
      ...params,
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        Client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
