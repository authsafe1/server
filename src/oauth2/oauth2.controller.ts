import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Session,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  OAuth2AuthorizeDto,
  OAuth2AuthorizeQuery,
  OAuth2TokenDto,
} from "../common/dtos/oauth2.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { OAuth2Service } from "./oauth2.service";

@Controller("oauth2")
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Post("authorize")
  async authorize(
    @Body() dto: OAuth2AuthorizeDto,
    @Query() query: OAuth2AuthorizeQuery,
  ) {
    const { email, password } = dto;
    const { client_id, redirect_uri, organization_id, scope, state, nonce } =
      query;

    if (!organization_id) {
      throw new UnauthorizedException("Organization context is missing");
    }

    const user = await this.oauth2Service.validateUser(
      email,
      password,
      organization_id,
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const code = await this.oauth2Service.generateAuthorizationCode(
      user.id,
      client_id,
      redirect_uri,
      scope,
      nonce,
      organization_id,
    );

    return { redirect_uri, code, state };
  }

  @Post("token")
  async token(
    @Body()
    dto: OAuth2TokenDto,
  ) {
    const { code, client_id, client_secret, redirect_uri } = dto;

    const tokenResponse = await this.oauth2Service.exchangeAuthorizationCode(
      code,
      client_id,
      client_secret,
      redirect_uri,
    );

    return tokenResponse;
  }

  @Get("userinfo")
  async userInfo(@Headers("authorization") authorization: string) {
    if (!authorization || !authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authorization.split(" ")[1];
    return this.oauth2Service.validateToken(token);
  }

  @UseGuards(EnsureLoginGuard)
  @Get(".well-known/jwks")
  async jwks(@Session() session: Request["session"]) {
    return this.oauth2Service.getJWKS(session?.organization?.id);
  }
}
