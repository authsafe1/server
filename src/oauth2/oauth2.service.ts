import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { Client, Permission, Role, User } from "@prisma/client";
import argon2 from "argon2";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import { Lock } from "redlock";
import { AuthorizationLogService } from "../common/modules/log/authorization-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";
import { RedlockService } from "../common/modules/redlock/redlock.service";

@Injectable()
export class OAuth2Service {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redlockService: RedlockService,
    private readonly jwtService: JwtService,
    private readonly authorizationLogService: AuthorizationLogService,
  ) {}

  async grantCode(
    client: Client,
    user: User,
    redirectUri: string,
    scope: string[],
    state: string,
    nonce: string,
    ip: string,
  ) {
    try {
      if (client.redirectUri !== redirectUri) {
        throw new Error("INCORRECT_REDIRECT_URI");
      }
      const authorizationCode =
        await this.prismaService.authorizationCode.create({
          data: {
            redirectUri,
            scope,
            state,
            nonce,
            expiresAt: dayjs(new Date()).add(10, "minutes").toDate(),
            User: {
              connect: {
                id: user.id,
              },
            },
            Client: {
              connect: {
                id: client.id,
              },
            },
          },
        });
      await this.authorizationLogService.logAuthorization(
        user.id,
        client.id,
        user.organizationId,
        "Authorization code created",
        ip,
      );
      return authorizationCode;
    } catch (err) {
      switch (err.message) {
        case "INCORRECT_REDIRECT_URI":
          throw new BadRequestException("Mismatched redirect uri");
        default:
          throw new InternalServerErrorException();
      }
    }
  }

  async exchangeTokenFromCode(
    client: Client,
    code: string,
    redirectUri: string,
  ) {
    const resource = `locks:authorization_code:${code}`;
    let lock: Lock;
    try {
      lock = await this.redlockService.acquireLock(resource, 30000);

      const authCode =
        await this.prismaService.authorizationCode.findUniqueOrThrow({
          where: { code },
          include: {
            Client: true,
            User: {
              include: {
                Role: {
                  include: {
                    Permissions: true,
                  },
                },
                Organization: {
                  include: {
                    Secret: { select: { id: true, privateKey: true } },
                  },
                },
              },
            },
          },
        });

      if (
        authCode.clientId !== client.id ||
        authCode.redirectUri !== redirectUri
      ) {
        throw new Error("AUTH_CODE_ERROR");
      }

      await this.prismaService.authorizationCode.delete({
        where: {
          id: authCode.id,
        },
      });
      await this.authorizationLogService.logAuthorization(
        authCode.userId,
        authCode.clientId,
        authCode.User.organizationId,
        "Code exchanged for Id Token",
      );
      return await this.generateIdToken(
        authCode.User,
        authCode?.User?.Organization?.Secret?.privateKey,
        authCode?.User?.Organization?.Secret?.id,
        authCode.Client,
        authCode.scope,
        authCode.nonce,
      );
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Code not valid");
      }
      switch (err.message) {
        case "AUTH_CODE_ERROR":
          throw new BadRequestException("Error in authorization code");
        default:
          throw new InternalServerErrorException();
      }
    } finally {
      if (lock) {
        await this.redlockService.releaseLock(lock);
      }
    }
  }

  async validateUser(email: string, password: string, organizationId: string) {
    try {
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: {
          email,
          organizationId,
        },
      });
      if (await argon2.verify(user.password, password)) {
        return user;
      } else {
        throw new Error("INCORRECT_CREDENTIALS");
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Email not found");
      }
      switch (err.message) {
        case "INCORRECT_CREDENTIALS":
          throw new UnauthorizedException("Incorrect credentials");
        default:
          throw new InternalServerErrorException();
      }
    }
  }

  async validateClient(clientId: string, clientSecret?: string) {
    try {
      return await this.prismaService.client.findUniqueOrThrow({
        where: {
          id: clientId,
          secret: clientSecret,
        },
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Client not found");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateToken(token: string) {
    try {
      const decodedToken = (await this.jwtService.decode(token)) as {
        org_id: string;
      };
      const organization =
        await this.prismaService.organization.findUniqueOrThrow({
          where: {
            id: decodedToken.org_id,
          },
          include: {
            Secret: {
              select: {
                publicKey: true,
              },
            },
          },
        });
      return await this.jwtService.verifyAsync(token, {
        publicKey: organization?.Secret?.publicKey,
        algorithms: ["RS256"],
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException("Expired token");
      } else if (err.code === "P2025") {
        throw new UnauthorizedException("Token's organization ID not valid");
      } else {
        throw new InternalServerErrorException("Failed to verify token");
      }
    }
  }

  async generateIdToken(
    user: User & { Role: Role & { Permissions: Permission[] } },
    privateKey: string,
    keyId: string,
    client: Client,
    scope: string[],
    nonce: string,
  ) {
    const standardPayload = {
      iss: process.env.APP_URI,
      sub: `authsafe|${user.id}`,
      aud: client.id,
      iat: dayjs().unix(),
      exp: dayjs().add(1, "hour").unix(),
      nonce,
      org_id: user.organizationId,
    };

    let payload = { ...standardPayload };

    if (scope.includes("profile")) {
      payload["name"] = user?.name;
      payload["email"] = user?.email;
    }

    if (scope.includes("role")) {
      payload["role"] = user?.Role?.key;
    }

    if (scope.includes("permissions")) {
      payload["permissions"] = user?.Role?.Permissions.map(value => value?.key);
    }

    return await this.jwtService.signAsync(payload, {
      privateKey,
      algorithm: "RS256",
      header: { alg: "RS256", kid: keyId },
    });
  }

  async jwks(organizationId: string) {
    try {
      const organization =
        await this.prismaService.organization.findUniqueOrThrow({
          where: {
            id: organizationId,
          },
          include: {
            Secret: true,
          },
        });
      const modulus = this.getJWKModulusFromPublicKey(
        organization.Secret?.publicKey,
      );
      return {
        keys: [
          {
            kty: modulus.kty,
            kid: organization.Secret?.id,
            use: "sig",
            alg: "RS256",
            n: modulus.n,
            e: modulus.e,
          },
        ],
      };
    } catch (err) {
      if (err.code === "P2025") {
        throw new UnauthorizedException("Organization not found");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private getJWKModulusFromPublicKey(publicKeyPem: string) {
    const publicKey = createPublicKey(publicKeyPem);
    return publicKey.export({ format: "jwk" });
  }
}
