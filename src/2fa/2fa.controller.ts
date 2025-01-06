import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Cache } from "cache-manager";
import { Request, Response } from "express";
import { CacheInvalidate } from "../common/decorators/cache.decorator";
import { TwoFaBackupVerifyDto, TwoFaVerifyDto } from "../common/dtos/2fa.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { TwoFAService } from "./2fa.service";

@Controller("2fa")
export class TwoFAController {
  constructor(
    private readonly twoFAService: TwoFAService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @UseGuards(EnsureLoginGuard)
  @Post("enable")
  @CacheInvalidate("isAuthenticated")
  async enableTwoFA(@Req() req: Request) {
    return await this.twoFAService.enableTwoFactorAuth(
      req.session.organization.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("disable")
  @CacheInvalidate("isAuthenticated")
  async disableTwoFA(@Req() req: Request) {
    await this.twoFAService.disableTwoFactorAuth(req.session.organization.id);
    return { message: "2FA disabled" };
  }

  @Post("verify")
  async verifyToken(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: TwoFaVerifyDto,
  ) {
    const { isValid, organization } = await this.twoFAService.verifyToken(
      dto.token,
      dto.email,
    );
    if (!isValid) {
      return res.status(401).json({ message: "Invalid 2FA Token" });
    } else {
      req.session.organization = {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        domain: organization.domain,
        metadata: organization.metadata,
        Secret: organization.Secret,
      };
      return res.status(200).json({ message: "2FA Verified" });
    }
  }

  @Post("backup/verify")
  async verifyBackupCode(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: TwoFaBackupVerifyDto,
  ) {
    const { organization } = await this.twoFAService.validateBackupCode(
      dto.code,
    );
    req.session.organization = {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      email: organization.email,
      metadata: organization.metadata,
      Secret: organization.Secret,
    };
    return res.status(200).json({ message: "Backup Code Verified" });
  }
}
