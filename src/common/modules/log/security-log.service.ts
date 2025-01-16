import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { Prisma, Severity } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SecurityAlertService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(SecurityAlertService.name);

  async getAllSecurityAlerts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SecurityAlertWhereUniqueInput;
    where?: Prisma.SecurityAlertWhereInput;
    orderBy?: Prisma.SecurityAlertOrderByWithRelationInput;
  }) {
    return await this.prismaService.securityAlert.findMany({
      ...params,
    });
  }

  async countSecurityAlerts(where: Prisma.SecurityAlertWhereInput) {
    try {
      return await this.prismaService.securityAlert.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async createAlert(
    message: string,
    severity: Severity,
    profileId: string,
    ip?: string,
    url?: string,
  ) {
    try {
      return this.prismaService.securityAlert.create({
        data: {
          message,
          severity,
          ip,
          url,
          Profile: { connect: { id: profileId } },
        },
      });
    } catch (err) {
      this.logger.error(err);
    }
  }

  async getAlertCount(where: Prisma.SecurityAlertWhereInput) {
    return await this.prismaService.securityAlert.count({
      where,
    });
  }
}
