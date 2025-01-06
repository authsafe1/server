import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Secret } from "@prisma/client";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { promisify } from "util";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createApiKey(
    data: Omit<Prisma.ApiKeyCreateInput, "token">,
    organization: {
      id: string;
      Secret: Pick<Secret, "privateKey" | "id">;
    },
  ) {
    try {
      const expiresAt = dayjs(data.expiresAt);
      const token = await this.generateToken();
      return await this.prismaService.apiKey.create({
        data: {
          ...data,
          token,
          expiresAt: expiresAt.toDate(),
          Secret: { connect: { id: organization.Secret.id } },
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async countApiKeys(where: Prisma.ApiKeyWhereInput) {
    try {
      return await this.prismaService.apiKey.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllApiKeys(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ApiKeyWhereUniqueInput;
    where?: Prisma.ApiKeyWhereInput;
    orderBy?: Prisma.ApiKeyOrderByWithRelationInput;
  }) {
    return this.prismaService.apiKey.findMany({
      ...params,
    });
  }

  async getApiKeyByToken(
    token: string,
    organization: {
      id: string;
      Secret: Pick<Secret, "privateKey" | "id">;
    },
  ) {
    try {
      return await this.prismaService.apiKey.findUniqueOrThrow({
        where: { token, secretId: organization.Secret.id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`ApiKey with Token ${token} not found`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async deleteApiKey(token: string) {
    const findApiKey = await this.prismaService.apiKey.findUnique({
      where: { token },
    });
    if (!findApiKey) {
      throw new NotFoundException(`ApiKey with Token ${token} not found`);
    }
    return await this.prismaService.apiKey.delete({
      where: { token },
    });
  }

  private async generateToken() {
    return (await promisify(randomBytes)(32)).toString("hex");
  }
}
