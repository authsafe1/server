import { InjectQueue } from "@nestjs/bullmq";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma, User } from "@prisma/client";
import argon2 from "argon2";
import { Queue } from "bullmq";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { promisify } from "util";
import { MailAction } from "../common/enums/MailActionJob";
import { QueueName } from "../common/enums/QueueName";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

type UserWithoutPassword = Omit<User, "password">;

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QueueName.MAIL) private readonly mailQueue: Queue,
  ) {}

  private createURL(token: string) {
    return `${process.env.APP_URL}/user/confirm?token=${token}`;
  }

  private userInvitationEmailBody(url: string) {
    return `
          <!DOCTYPE html>
<html
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="format-detection" content="date=no" />
    <meta name="format-detection" content="address=no" />
    <meta name="format-detection" content="email=no" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Verify Email</title>
  </head>
  <div
    style="
      font-family: Arial, sans-serif;
      background: #6a11cb;
      background: -webkit-linear-gradient(
        to right,
        rgba(106, 17, 203, 1),
        rgba(37, 117, 252, 1)
      );
      background: linear-gradient(
        to right,
        rgba(106, 17, 203, 1),
        rgba(37, 117, 252, 1)
      );
      padding: 20px;
      max-width: 600px;
      margin: auto;
      border-radius: 10px;
    "
  >
    <div
      style="
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      "
    >
      <h1
        style="
          text-align: center;
          color: #333333;
          font-size: 24px;
          margin-bottom: 20px;
        "
      >
        AuthSafe
      </h1>
      <p
        style="
          color: #666666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 20px;
        "
      >
        Hello,
      </p>
      <p
        style="
          color: #666666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 20px;
        "
      >
        This is an invitation for AuthSafe user. Click the button below to reset
        it.
      </p>
      <div style="text-align: center; margin-bottom: 30px">
        <a
          href="${url}"
          style="
            display: inline-block;
            padding: 12px 24px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            border-radius: 5px;
            text-decoration: none;
          "
        >
          Accept Invitation
        </a>
      </div>
      <p
        style="
          color: #666666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 20px;
        "
      >
        If you do not want to be part of AuthSafe, please ignore this email!
      </p>
      <p style="color: #666666; font-size: 16px; line-height: 1.5">
        Thanks,<br />AuthSafe Team
      </p>
      <p
        style="
          color: #999999;
          font-size: 14px;
          text-align: center;
          margin-top: 30px;
          border-top: 1px solid #eeeeee;
          padding-top: 20px;
        "
      >
        © 2024 AuthSafe. All rights reserved.
      </p>
      <p style="color: #999999; font-size: 14px; text-align: center">
        If you're having trouble clicking the "Verify Your Email" button, click
        or copy and paste the URL below into your web browser:
        <br />
        <a href="${url}" style="color: #007bff; text-decoration: none">URL</a>
      </p>
    </div>
  </div>
</html>
      `;
  }

  async users(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.UserWhereUniqueInput;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    },
    organizationId: string,
  ) {
    const { where, ...paramsWithoutWhere } = params;
    try {
      return await this.prismaService.user.findMany({
        ...paramsWithoutWhere,
        where: {
          organizationId,
          ...where,
        },
        include: {
          Role: true,
        },
        omit: {
          password: true,
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async user(where: Prisma.UserWhereUniqueInput): Promise<UserWithoutPassword> {
    try {
      return this.prismaService.user.findUniqueOrThrow({
        where,
        omit: { password: true },
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async createUser(
    organizationId: string,
    unhashedData: Omit<
      Prisma.UserCreateInput,
      "Organization" | "verificationToken"
    >,
  ) {
    try {
      const { email, password, name } = unhashedData;
      const digest = await argon2.hash(password);
      const user = await this.prismaService.user.create({
        data: {
          name,
          email,
          password: digest,
          isVerified: true,
          Organization: {
            connect: { id: organizationId },
          },
        },
        omit: { password: true },
      });
      await this.eventEmitter.emitAsync("user.created", { user });
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async createUsers(
    organizationId: string,
    unhashedData: Omit<
      Prisma.UserCreateManyInput,
      "Organization" | "verificationToken" | "organizationId"
    >[],
  ) {
    try {
      const hashedUsers = await Promise.all(
        unhashedData.map(async user => ({
          ...user,
          password: await argon2.hash(user.password),
          isVerified: true,
          organizationId,
        })),
      );
      const users = await this.prismaService.user.createManyAndReturn({
        data: hashedUsers,
        skipDuplicates: true,
        omit: { password: true },
      });
      await this.eventEmitter.emitAsync("user.bulkCreated", { users });
      return { message: `${users.length} users created` };
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async inviteUser(
    organizationId: string,
    data: Pick<Prisma.UserCreateInput, "email">,
  ) {
    try {
      const token = (await promisify(randomBytes)(64)).toString("hex");
      const user = await this.prismaService.user.create({
        data: {
          email: data.email,
          isVerified: false,
          verificationToken: token,
          Organization: {
            connect: { id: organizationId },
          },
        },
        omit: { password: true },
      });

      const url = this.createURL(token);

      await this.mailQueue.add(MailAction.SEND, {
        from: { name: process.env.EMAIL_FROM, address: process.env.EMAIL_ID },
        to: user.email,
        subject: "User Invitation - Create Your Account",
        html: this.userInvitationEmailBody(url),
      });

      await this.eventEmitter.emitAsync("user.invited", { user });
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async verifyUser(
    token: string,
    unhashedData: Pick<Prisma.UserCreateInput, "name" | "password">,
  ) {
    try {
      const { name, password } = unhashedData;
      const digest = await argon2.hash(password);
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: {
          verificationToken: token,
        },
        omit: { password: true },
      });
      await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
          verificationToken: "",
          name,
          password: digest,
        },
        omit: { password: true },
      });
      await this.eventEmitter.emitAsync("user.created", { user });
      return user;
    } catch (err) {
      if (err.code === "P2025") {
        throw new NotFoundException("Token not found or expired");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<UserWithoutPassword> {
    const { where, data } = params;
    const { name, email, password } = data;
    try {
      const user = await this.prismaService.user.update({
        data: {
          name,
          email,
          password: password
            ? await argon2.hash(password as string)
            : undefined,
        },
        where,
        omit: { password: true },
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        user.Organization.profileId,
        "User updated",
      );
      await this.eventEmitter.emitAsync("user.updated", { user });
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async assignRole(
    id: string,
    organizationId: string,
    dto: { roleId: string },
  ) {
    try {
      const user = await this.prismaService.user.update({
        where: {
          id,
          organizationId,
        },
        data: {
          Role: {
            connect: {
              id: dto.roleId,
            },
          },
        },
        omit: { password: true },
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        user.Organization.profileId,
        "User role assigned",
      );
      await this.eventEmitter.emitAsync("user.role.assigned", { user });
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async deleteUser(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithoutPassword> {
    try {
      const user = await this.prismaService.user.delete({
        where,
        omit: { password: true },
        include: {
          Organization: {
            select: { profileId: true },
          },
        },
      });
      await this.activityLogService.logActivity(
        user.Organization.profileId,
        "User deleted",
      );
      await this.eventEmitter.emitAsync("user.deleted", { user });
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async countUsers(where: Prisma.UserWhereInput) {
    try {
      return await this.prismaService.user.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getMonthlyUserCount(organizationId: string) {
    const startOfYear = dayjs().startOf("year").toDate();
    const endOfYear = dayjs().endOf("year").toDate();

    const userCounts = await this.prismaService.user.groupBy({
      by: ["createdAt"],
      where: {
        organizationId,
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      _count: { _all: true },
      orderBy: {
        createdAt: "asc",
      },
    });

    const monthlyCounts = Array(12).fill(0);

    userCounts.forEach(entry => {
      const monthIndex = dayjs(entry.createdAt).month();
      monthlyCounts[monthIndex] += entry._count._all;
    });

    return monthlyCounts;
  }
}
