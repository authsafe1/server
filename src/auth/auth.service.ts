import { InjectQueue } from "@nestjs/bullmq";
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { Profile } from "@prisma/client";
import argon2 from "argon2";
import { Queue } from "bullmq";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { promisify } from "util";
import { MailAction } from "../common/enums/MailActionJob";
import { QueueName } from "../common/enums/QueueName";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
    @InjectQueue(QueueName.MAIL) private readonly mailQueue: Queue,
  ) {}

  private createURL(token: string) {
    if (process.env.NODE_ENV === "production") {
      return `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    } else {
      return `http://localhost:3000/auth/reset-password?token=${token}`;
    }
  }

  private createEmailBody(body: Profile, url: string) {
    return `
        <div
  style="font-family: Arial, sans-serif; background: #6a11cb; background: -webkit-linear-gradient(to right, rgba(106, 17, 203, 1), rgba(37, 117, 252, 1)); background: linear-gradient(to right, rgba(106, 17, 203, 1), rgba(37, 117, 252, 1)); padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
  <div
    style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="text-align: center; color: #333333; font-size: 24px; margin-bottom: 20px;">AuthSafe</h1>
    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
      Hello ${body.name},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
      You recently requested to reset your password. Click the button below to
      reset it.
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${url}"
        style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #007bff; border-radius: 5px; text-decoration: none;">
        Reset Your Password
      </a>
    </div>
    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
      If you did not request a password reset, please ignore this email!
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
      Thanks,<br />AuthSafe Team
    </p>
    <p
      style="color: #999999; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
      © 2024 AuthSafe. All rights reserved.
    </p>
    <p style="color: #999999; font-size: 14px; text-align: center;">
      If you're having trouble clicking the "Reset Your Password" button, click or copy
      and paste the URL below into your web browser:
      <br />
      <a href="${url}" style="color: #007bff; text-decoration: none;">URL</a>
    </p>  
  </div>
</div>
    `;
  }

  async login(email: string, password: string) {
    try {
      const profile = await this.prismaService.profile.findUniqueOrThrow({
        where: {
          email,
        },
      });
      if (await argon2.verify(profile.password, password)) {
        return {
          redirectTo2Fa: profile.isTwoFactorAuthEnabled,
          profile,
        };
      } else {
        throw new Error("PASSWORD_MISMATCH");
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Email not found");
      } else if (err.message === "PASSWORD_MISMATCH") {
        throw new UnauthorizedException("Password mismatch");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async sendPasswordResetLink(email: string) {
    try {
      const profile = await this.prismaService.profile.findUniqueOrThrow({
        where: {
          email,
        },
      });

      const token = (await promisify(randomBytes)(64)).toString("hex");

      await this.prismaService.passwordResetToken.create({
        data: {
          token,
          expiresAt: dayjs(new Date()).add(10, "minutes").toDate(),
          Organization: {
            connect: {
              id: profile.id,
            },
          },
        },
      });

      const url = this.createURL(token);

      this.mailQueue.add(MailAction.SEND, {
        from: { name: process.env.EMAIL_FROM, address: process.env.EMAIL_ID },
        to: profile.email,
        subject: "Reset Your Password - Secure Your Account",
        html: this.createEmailBody(profile, url),
      });
    } catch (err) {
      if (err.code !== "P2025") {
        throw new InternalServerErrorException();
      }
    }
  }

  async googleCallback(email: string) {
    try {
      return await this.prismaService.profile.findUnique({
        where: {
          email,
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const resetToken =
        await this.prismaService.passwordResetToken.findUniqueOrThrow({
          where: { token },
          include: { Organization: true },
        });

      if (resetToken.expiresAt < new Date()) {
        await this.prismaService.passwordResetToken.delete({
          where: { id: resetToken.id },
        });
        throw new Error("EXPIRED_TOKEN");
      }

      const hashedPassword = await argon2.hash(newPassword);

      await this.prismaService.$transaction(async prisma => {
        await prisma.profile.update({
          where: { id: resetToken.organizationId },
          data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id },
        });
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Invalid Token");
      } else if (err.message === "EXPIRED_TOKEN") {
        throw new UnauthorizedException("Token Expired");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async isAuthenticated(profileId: string) {
    try {
      return await this.prismaService.profile.findUniqueOrThrow({
        where: {
          id: profileId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          plan: true,
          isVerified: true,
          isTwoFactorAuthEnabled: true,
          Organizations: {
            select: {
              id: true,
              name: true,
              domain: true,
              metadata: true,
              Secret: {
                select: {
                  publicKey: true,
                  ApiKeys: {
                    select: {
                      token: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Not Logged In");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
