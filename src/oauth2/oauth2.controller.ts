import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  OAuth2Authorize,
  OAuth2AuthorizeQuery,
  OAuth2Token,
} from "../common/dtos/oauth2.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { OAuth2Service } from "./oauth2.service";

@Controller("oauth2")
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Post("authorize")
  async authorize(
    @Body() dto: OAuth2Authorize,
    @Query() query: OAuth2AuthorizeQuery,
    @Req() req: Request,
  ) {
    if (!query.scope.includes("openid")) {
      throw new BadRequestException(
        "Openid scope is required in authentication scenario",
      );
    }

    const user = await this.oauth2Service.validateUser(
      dto.email,
      dto.password,
      query.organization_id,
    );
    const client = await this.oauth2Service.validateClient(query.client_id);

    const authCode = await this.oauth2Service.grantCode(
      client,
      user,
      query.redirect_uri,
      query.scope,
      query.state,
      query.nonce,
      req.ip,
    );

    return {
      authorization_code: authCode.code,
      state: authCode.state,
      redirect_uri: authCode.redirectUri,
    };
  }

  @Post("token")
  async token(@Body() dto: OAuth2Token) {
    const client = await this.oauth2Service.validateClient(
      dto.client_id,
      dto.client_secret,
    );

    const idToken = await this.oauth2Service.exchangeTokenFromCode(
      client,
      dto.code,
      dto.redirect_uri,
    );

    return {
      id_token: idToken,
      token_type: "Bearer",
      expires_in: 3600,
    };
  }

  @Get("userinfo")
  async userinfo(@Headers("authorization") authHeader: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Authorization header is missing or malformed",
      );
    }

    const idToken = authHeader.split(" ")[1];

    return await this.oauth2Service.validateToken(idToken);
  }

  @UseGuards(EnsureLoginGuard)
  @Get(".well-known/jwks")
  async jwks(@Req() req: Request) {
    return await this.oauth2Service.jwks(req.session.organization?.id);
  }
}
