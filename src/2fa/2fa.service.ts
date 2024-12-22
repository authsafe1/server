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

  async enableTwoFactorAuth(organizationId: string) {
    try {
      const secret = authenticator.generateSecret();
      const organization =
        await this.prismaService.organization.findUniqueOrThrow({
          where: {
            id: organizationId,
          },
        });
      const otpAuthUrl = authenticator.keyuri(
        organization.email,
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
            organizationId,
          })),
        });

        await prisma.organization.update({
          where: { id: organizationId },
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

  async disableTwoFactorAuth(organizationId: string) {
    return await this.prismaService.$transaction(async prisma => {
      await prisma.backupCode.deleteMany({
        where: {
          organizationId,
        },
      });

      return await prisma.organization.update({
        where: { id: organizationId },
        data: {
          isTwoFactorAuthEnabled: false,
          twoFactorSecret: null,
        },
      });
    });
  }

  async verifyToken(token: string, email: string) {
    try {
      const organization =
        await this.prismaService.organization.findUniqueOrThrow({
          where: {
            email,
          },
        });
      const isValid = authenticator.verify({
        token,
        secret: organization.twoFactorSecret,
      });
      return { isValid, organization };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Organization invalid");
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
        include: { Organization: true },
      });
      await this.prismaService.backupCode.update({
        where: { id: backupCode.id },
        data: { isUsed: true },
      });
      return { organization: backupCode.Organization };
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
