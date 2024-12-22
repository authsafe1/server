import { InjectQueue } from "@nestjs/bullmq";
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Organization, Prisma, Severity } from "@prisma/client";
import argon2 from "argon2";
import { Queue } from "bullmq";
import { UploadApiErrorResponse } from "cloudinary";
import { generateKeyPairSync, randomBytes } from "crypto";
import { promisify } from "util";
import { MailAction } from "../common/enums/MailActionJob";
import { QueueName } from "../common/enums/QueueName";
import { CloudinaryService } from "../common/modules/cloudinary/cloudinary.service";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { SecurityAlertService } from "../common/modules/log/security-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly securityLogService: SecurityAlertService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QueueName.MAIL) private readonly mailQueue: Queue,
  ) {}

  private createURL(token: string) {
    if (process.env.NODE_ENV === "production") {
      return `${process.env.APP_URL}/auth/confirm?token=${token}`;
    } else {
      return `http://localhost:5173/auth/confirm?token=${token}`;
    }
  }

  private organizationCreationEmailBody(body: Organization, url: string) {
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
        Hello ${body.name},
      </p>
      <p
        style="
          color: #666666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 20px;
        "
      >
        This is to verify your email. Click the button below to verify it.
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
          Verify Your Email
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
        If you did not create an user, please ignore this email!
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

  async createOrganization(unhashedData: Prisma.OrganizationCreateInput) {
    try {
      const { name, domain, email, password } = unhashedData;
      const digest = await argon2.hash(password);
      const token = (await promisify(randomBytes)(64)).toString("hex");

      const { publicKey, privateKey } = this.generateKeyPair();

      const organization = await this.prismaService.organization.create({
        data: {
          name,
          domain,
          email,
          password: digest,
          isVerified: false,
          verificationToken: token,
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

      const url = this.createURL(token);

      await this.mailQueue.add(MailAction.SEND, {
        from: { name: process.env.EMAIL_FROM, address: process.env.EMAIL_ID },
        to: organization.email,
        subject: "Verify Your Email - Create Your Account",
        html: this.organizationCreationEmailBody(organization, url),
      });

      await this.eventEmitter.emitAsync("organization.created", {
        organization,
      });

      return { message: "Verification link has been sent to your email" };
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async createOrganizationDirectly(
    unhashedData: Prisma.OrganizationCreateInput,
  ) {
    try {
      const { name, domain, email, password } = unhashedData;
      const digest = await argon2.hash(password);

      const { publicKey, privateKey } = this.generateKeyPair();

      return await this.prismaService.organization.create({
        data: {
          name,
          domain,
          email,
          password: digest,
          isVerified: true,
          verificationToken: "",
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
        omit: { password: true },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async verifyOrganizationCreation(token: string, ip: string) {
    try {
      const unverifiedOrganization =
        await this.prismaService.organization.findUniqueOrThrow({
          where: {
            verificationToken: token,
          },
        });

      const organization = await this.prismaService.organization.update({
        where: {
          id: unverifiedOrganization.id,
        },
        data: {
          isVerified: true,
          verificationToken: "",
        },
      });

      await this.activityLogService.logActivity(
        organization.id,
        "New organization verified",
      );
      await this.eventEmitter.emitAsync("organization.verified", {
        organization,
      });
      return { message: "Verified" };
    } catch (err) {
      if (err.code === "P2025") {
        this.securityLogService.createAlert(
          "Token not found",
          Severity.HIGH,
          ip,
          "/api/auth/confirm",
        );
        throw new UnauthorizedException("Token not found");
      }
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
        throw new NotFoundException("User not found");
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
      return organization;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async updateProfilePhoto(params: {
    where: Prisma.OrganizationWhereUniqueInput;
    file: Express.Multer.File;
  }) {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(
        params.file,
        200,
        200,
      );
      const organization = await this.prismaService.organization.update({
        where: params.where,
        data: {
          photo: uploadResult.secure_url || uploadResult.url,
        },
        select: {
          id: true,
          name: true,
          photo: true,
        },
      });
      await this.eventEmitter.emitAsync("organization.photo.updated", {
        organization,
      });
      return organization;
    } catch (error) {
      if (
        (error as UploadApiErrorResponse).http_code &&
        (error as UploadApiErrorResponse).message
      ) {
        throw new HttpException(
          (error as UploadApiErrorResponse).message,
          (error as UploadApiErrorResponse).http_code,
        );
      } else {
        throw new InternalServerErrorException(
          "Failed to upload to cloudinary",
        );
      }
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
