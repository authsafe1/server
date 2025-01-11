import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { generateKeyPairSync } from "crypto";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrganization(data: Prisma.OrganizationCreateInput) {
    try {
      const { publicKey, privateKey } = this.generateKeyPair();

      const organization = await this.prismaService.organization.create({
        data: {
          ...data,
          metadata: {},
          Secret: {
            create: {
              privateKey,
              publicKey,
            },
          },
          Branding: {
            create: {
              logo: "",
              theme: "dark",
              backgroundImage: "",
              header: "Sign In",
              subHeader: "Please enter your details to continue",
              primaryColor: "#B153FE",
              buttonText: "Login",
            },
          },
        },
      });

      await this.eventEmitter.emitAsync("organization.created", {
        organization,
      });

      await this.activityLogService.logActivity(
        organization.id,
        "Organization Created",
      );

      return organization;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getBranding(where: Prisma.BrandingWhereUniqueInput) {
    try {
      return await this.prismaService.branding.findUniqueOrThrow({
        where,
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updateBranding(
    where: Prisma.BrandingWhereUniqueInput,
    data: Prisma.BrandingUpdateInput,
  ) {
    try {
      return await this.prismaService.branding.update({
        where,
        data,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async organization(where: Prisma.OrganizationWhereUniqueInput) {
    try {
      return await this.prismaService.organization.findUniqueOrThrow({
        where,
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization not found");
      }
      throw new InternalServerErrorException();
    }
  }

  async updateOrganization(params: {
    where: Prisma.OrganizationWhereUniqueInput;
    data: Prisma.OrganizationUpdateInput;
  }) {
    try {
      const organization = await this.prismaService.organization.update({
        where: params.where,
        data: params.data,
      });
      await this.eventEmitter.emitAsync("organization.updated", {
        organization,
      });
      await this.activityLogService.logActivity(
        organization.id,
        "Organization updated",
      );
      return organization;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async deleteOrganization(where: Prisma.OrganizationWhereUniqueInput) {
    try {
      const organization = await this.prismaService.organization.delete({
        where,
      });
      await this.eventEmitter.emitAsync("organization.deleted", {
        organization,
      });
      await this.activityLogService.logActivity(
        organization.id,
        "Organization Deleted",
      );
      return organization;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  private generateKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return { publicKey, privateKey };
  }
}
