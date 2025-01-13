import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ActivityLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllActivityLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ActivityLogWhereUniqueInput;
    where?: Prisma.ActivityLogWhereInput;
    orderBy?: Prisma.ActivityLogOrderByWithRelationInput;
  }) {
    return await this.prismaService.activityLog.findMany({
      ...params,
    });
  }

  async countActivityLogs(where: Prisma.ActivityLogWhereInput) {
    try {
      return await this.prismaService.activityLog.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async logActivity(profileId: string, description: string) {
    return await this.prismaService.activityLog.create({
      data: {
        description,
        Profile: {
          connect: { id: profileId },
        },
      },
    });
  }

  async getUserActivityOverTime(profileId: string) {
    try {
      const activities = await this.prismaService.activityLog.findMany({
        where: { profileId },
        select: {
          createdAt: true,
        },
      });

      const activityCountByTime = activities.reduce((acc, log) => {
        const date = dayjs(log.createdAt).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const xAxisData = Object.keys(activityCountByTime).map(value =>
        dayjs(value).valueOf(),
      );
      const yAxisData = Object.values(activityCountByTime);
      return {
        xAxis: xAxisData,
        yAxis: yAxisData,
      };
    } catch {
      throw new InternalServerErrorException("Failed to fetch activity data");
    }
  }
}
