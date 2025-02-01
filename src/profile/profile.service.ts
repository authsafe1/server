import { InjectQueue } from "@nestjs/bullmq";
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  Prisma,
  Profile,
  SubscriptionStatus,
  SubscriptionType,
} from "@prisma/client";
import argon2 from "argon2";
import { Queue } from "bullmq";
import { UploadApiErrorResponse } from "cloudinary";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { promisify } from "util";
import { MailAction } from "../common/enums/MailActionJob";
import { QueueName } from "../common/enums/QueueName";
import { CloudinaryService } from "../common/modules/cloudinary/cloudinary.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectQueue(QueueName.MAIL) private readonly mailQueue: Queue,
  ) {}

  private createURL(token: string) {
    return `${process.env.APP_URL}/auth/confirm?token=${token}`;
  }

  private profileCreationEmailBody(body: Profile, url: string) {
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

  async createProfile(unhashedData: Prisma.ProfileCreateInput) {
    try {
      const { name, email, password } = unhashedData;
      const digest = await argon2.hash(password);
      const token = (await promisify(randomBytes)(64)).toString("hex");

      const profile = await this.prismaService.$transaction(async prisma => {
        const newProfile = await prisma.profile.create({
          data: {
            name,
            email,
            password: digest,
            isVerified: false,
            verificationToken: token,
          },
        });
        await prisma.subscription.create({
          data: {
            profileId: newProfile.id,
            type: SubscriptionType.FREE,
            status: SubscriptionStatus.ACTIVE,
            startDate: dayjs().toDate(),
            endDate: dayjs().add(100, "years").toDate(),
            subscriptionId: `free-${newProfile.id}`,
          },
        });

        return newProfile;
      });

      const url = this.createURL(token);

      await this.mailQueue.add(MailAction.SEND, {
        from: { name: process.env.EMAIL_FROM, address: process.env.EMAIL_ID },
        to: profile.email,
        subject: "Verify Your Email - Create Your Account",
        html: this.profileCreationEmailBody(profile, url),
      });

      return { message: "Verification link has been sent to your email" };
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async createProfileDirectly(unhashedData: Prisma.ProfileCreateInput) {
    try {
      const { name, email, password } = unhashedData;
      const digest = await argon2.hash(password);

      return await this.prismaService.$transaction(async prisma => {
        const newProfile = await prisma.profile.create({
          data: {
            name,
            email,
            password: digest,
            isVerified: true,
            verificationToken: "",
          },
        });
        await prisma.subscription.create({
          data: {
            type: SubscriptionType.FREE,
            status: SubscriptionStatus.ACTIVE,
            startDate: dayjs().toDate(),
            endDate: dayjs().add(100, "years").toDate(),
            subscriptionId: `free-${newProfile.id}`,
            Profile: {
              connect: {
                id: newProfile.id,
              },
            },
          },
        });

        return newProfile;
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async verifyProfileCreation(token: string) {
    try {
      const unverifiedProfile =
        await this.prismaService.profile.findUniqueOrThrow({
          where: {
            verificationToken: token,
          },
        });
      await this.prismaService.profile.update({
        where: {
          id: unverifiedProfile.id,
        },
        data: {
          isVerified: true,
          verificationToken: "",
        },
      });
      return { message: "Verified" };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Token not found");
      }
      throw new InternalServerErrorException();
    }
  }

  async profile(where: Prisma.ProfileWhereUniqueInput) {
    try {
      return await this.prismaService.profile.findUniqueOrThrow({
        where,
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException("Profile not found");
      }
      throw new InternalServerErrorException();
    }
  }

  async updateProfile(params: {
    where: Prisma.ProfileWhereUniqueInput;
    data: Prisma.ProfileUpdateInput;
  }) {
    try {
      return await this.prismaService.profile.update({
        where: params.where,
        data: params.data,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async changePassword(
    email: string,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      const profile = await this.prismaService.profile.findUniqueOrThrow({
        where: {
          email,
        },
      });
      if (argon2.verify(profile.password, oldPassword)) {
        const newDigest = await argon2.hash(newPassword);
        return await this.prismaService.profile.update({
          where: {
            email,
          },
          data: {
            password: newDigest,
          },
        });
      }
      return await this.prismaService.profile.update;
    } catch {}
  }

  async updateProfilePhoto(params: {
    where: Prisma.ProfileWhereUniqueInput;
    file: Express.Multer.File;
  }) {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(
        params.file,
        200,
        200,
      );
      return await this.prismaService.profile.update({
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

  async deleteProfile(where: Prisma.ProfileWhereUniqueInput) {
    try {
      return await this.prismaService.profile.delete({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
