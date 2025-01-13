import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { Client, Permission, Role, User } from "@prisma/client";
import argon2 from "argon2";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import { AuthorizationLogService } from "../common/modules/log/authorization-log.service";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class OAuth2Service {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authorizationLogService: AuthorizationLogService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate the user based on email, password, and organization.
   * @param email - User email.
   * @param password - Plain text password.
   * @param organizationId - ID of the organization.
   * @returns User object if validation is successful; otherwise null.
   */
  async validateUser(email: string, password: string, organizationId: string) {
    const user = await this.prismaService.user.findFirst({
      where: { email, organizationId },
    });

    if (!user || !user.password) return null;

    const isPasswordValid = await argon2.verify(user.password, password);
    return isPasswordValid ? user : null;
  }

  /**
   * Generate a secure authorization code for the user.
   * @param userId - ID of the user.
   * @param clientId - ID of the client.
   * @param redirectUri - Redirect URI after
   * @param scope - Authorization scope
   * @returns Generated authorization code.
   */
  async generateAuthorizationCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    scope: string[],
    nonce: string,
    profileId: string,
  ) {
    // Validate client and redirect URI
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.redirectUri !== redirectUri) {
      throw new UnauthorizedException("Invalid client or redirect URI");
    }

    const code = Math.random().toString(36).substring(2, 15); // Replace with a secure generator
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    await this.prismaService.authorizationCode.create({
      data: {
        code,
        expiresAt,
        redirectUri,
        scope,
        nonce,
        Client: {
          connect: { id: clientId },
        },
        User: {
          connect: { id: userId },
        },
      },
    });

    await this.authorizationLogService.logAuthorization(
      userId,
      clientId,
      profileId,
      "Authorization code created",
    );

    await this.authorizationLogService.logAuthorization(
      userId,
      clientId,
      profileId,
      "Authorization code created",
    );
    return code;
  }

  /**
   * Exchange an authorization code for tokens (ID and access tokens).
   * @param code - Authorization code.
   * @param clientId - Client ID.
   * @param clientSecret - Client secret.
   * @param organizationId - Organization ID.
   * @returns Tokens (ID token, access token, etc.).
   */
  async exchangeAuthorizationCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ) {
    const authCode = await this.prismaService.authorizationCode.findUnique({
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

    if (!authCode || authCode.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired authorization code");
    }

    // Validate client ID
    if (authCode.clientId !== clientId) {
      throw new UnauthorizedException("Invalid client ID");
    }

    // Validate redirect URI
    if (authCode.redirectUri !== redirectUri) {
      throw new UnauthorizedException("Redirect URI mismatch");
    }

    if (authCode.Client.secret !== clientSecret) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    if (!authCode.User) {
      throw new UnauthorizedException("User not found");
    }

    if (!authCode.User.Organization.Secret)
      throw new UnauthorizedException("Missing organization keys");

    const idToken = await this.generateIdToken(
      authCode.User,
      authCode.User.Organization.Secret.privateKey,
      authCode.User.Organization.Secret.id,
      authCode.Client,
      authCode.scope,
      authCode.nonce,
    );

    const accessToken = await this.generateAcessToken(
      authCode.User,
      authCode.User.Organization.Secret.privateKey,
      authCode.User.Organization.Secret.id,
      authCode.Client,
      authCode.scope,
    );

    await this.authorizationLogService.logAuthorization(
      authCode.userId,
      authCode.clientId,
      authCode.User.Organization.profileId,
      "Token exchanged for Code",
    );

    return {
      id_token: idToken,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
    };
  }

  /**
   * Validate ID Token.
   * @param token - JWT ID Token.
   * @returns Token payload.
   */
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
      const verifiedToken = await this.jwtService.verifyAsync(token, {
        publicKey: organization.Secret.publicKey,
        algorithms: ["RS256"],
      });
      const user = await this.prismaService.user.findUnique({
        where: { id: verifiedToken.sub.split("|")[1] },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      return verifiedToken;
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

  /**
   * Retrieve the organization's JWKS.
   * @param organizationId - Organization ID.
   * @returns JWKS JSON object.
   */
  async getJWKS(organizationId: string) {
    const secret = await this.prismaService.secret.findUnique({
      where: { organizationId },
    });
    if (!secret) throw new UnauthorizedException("Missing organization keys");

    const publicKey = createPublicKey(secret.publicKey);
    const modulus = publicKey.export({ format: "jwk" });

    return {
      keys: [
        {
          kty: modulus.kty,
          kid: secret.id,
          use: "sig",
          alg: "RS256",
          n: modulus.n,
          e: modulus.e,
        },
      ],
    };
  }

  /**
   * Generate an Id Token.
   * @param user: User,
   * @param privateKey: string,
   * @param keyId: string,
   * @param client: Client,
   * @param scope: string[],
   * @param nonce: string,.
   * @returns JWT Id Token.
   */
  private async generateIdToken(
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
      payload["email_verified"] = user?.isVerified;
    }

    return await this.jwtService.signAsync(payload, {
      privateKey,
      algorithm: "RS256",
      header: { alg: "RS256", kid: keyId },
    });
  }

  /**
   * Generate an Access Token.
   * @param user: User,
   * @param privateKey: string,
   * @param keyId: string,
   * @param client: Client,
   * @param scope: string[],
   * @param nonce: string,.
   * @returns JWT Access Token.
   */
  private async generateAcessToken(
    user: User & { Role: Role & { Permissions: Permission[] } },
    privateKey: string,
    keyId: string,
    client: Client,
    scope: string[],
  ) {
    const standardPayload = {
      iss: process.env.APP_URI,
      sub: `authsafe|${user.id}`,
      aud: client.id,
      iat: dayjs().unix(),
      exp: dayjs().add(1, "hour").unix(),
      scope,
      org_id: user.organizationId,
    };

    let payload = { ...standardPayload };

    if (scope.includes("roles")) {
      payload["roles"] = user?.Role?.key;
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
}
