import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class TwoFAService {
  constructor(private readonly prismaService: PrismaService) {}

  async enableTwoFactorAuth(profileId: string) {
    try {
      const secret = authenticator.generateSecret();
      const profile = await this.prismaService.profile.findUniqueOrThrow({
        where: {
          id: profileId,
        },
      });
      const otpAuthUrl = authenticator.keyuri(
        profile.email,
        "AuthSafe",
        secret,
      );
      const qrcode = await QRCode.toDataURL(otpAuthUrl);
      const backupCodes = Array.from({ length: 10 }, () =>
        this.generateBackupCode(),
      );

      await this.prismaService.$transaction(async prisma => {
        await prisma.backupCode.createMany({
          data: backupCodes.map(code => ({
            code,
            profileId,
          })),
        });

        await prisma.profile.update({
          where: { id: profileId },
          data: {
            twoFactorSecret: secret,
            isTwoFactorAuthEnabled: true,
          },
        });
      });

      return { qrcode, backupCodes };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Organization invalid");
      }
      throw new InternalServerErrorException();
    }
  }

  async disableTwoFactorAuth(profileId: string) {
    return await this.prismaService.$transaction(async prisma => {
      await prisma.backupCode.deleteMany({
        where: {
          profileId,
        },
      });

      return await prisma.profile.update({
        where: { id: profileId },
        data: {
          isTwoFactorAuthEnabled: false,
          twoFactorSecret: null,
        },
      });
    });
  }

  async verifyToken(token: string, email: string) {
    try {
      const profile = await this.prismaService.profile.findUniqueOrThrow({
        where: {
          email,
        },
      });
      const isValid = authenticator.verify({
        token,
        secret: profile.twoFactorSecret,
      });
      return { isValid, profile };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Profile invalid");
      }
      throw new InternalServerErrorException();
    }
  }

  async validateBackupCode(code: string) {
    try {
      const backupCode = await this.prismaService.backupCode.findUniqueOrThrow({
        where: {
          code,
          isUsed: false,
        },
        include: { Profile: true },
      });
      await this.prismaService.backupCode.update({
        where: { id: backupCode.id },
        data: { isUsed: true },
        include: { Profile: true },
      });
      return { profile: backupCode.Profile };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Backup code not found");
      }
      throw new InternalServerErrorException();
    }
  }

  private generateBackupCode(): string {
    return Math.random().toString(36).slice(-10);
  }
}
