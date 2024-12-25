import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SkipThrottle } from "@nestjs/throttler";
import { Organization } from "@prisma/client";
import { Cache as CacheType } from "cache-manager";
import { Request, Response } from "express";
import { Cache, CacheInvalidate } from "../common/decorators/cache.decorator";
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from "../common/dtos/auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: CacheType,
  ) {}

  @Post("login")
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    body: LoginDto,
  ) {
    try {
      const { email, password } = body;

      const { redirectTo2Fa, organization } = await this.authService.login(
        email,
        password,
      );
      if (redirectTo2Fa) {
        return res.status(200).json({ redirectTo2Fa: true });
      } else {
        req.session.organization = {
          id: organization.id,
          name: organization.name,
          domain: organization.domain,
          email: organization.email,
          metadata: organization.metadata,
        };
        return res.status(200).json({ message: "Logged in" });
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        return res.status(401).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const organization = await this.authService.googleCallback(
      (req.user as Organization)?.email,
    );
    if (organization) {
      req.session.organization = {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        email: organization.email,
        metadata: organization.metadata,
      };
      return res.redirect(process.env.DASHBOARD_URL);
    } else {
      res.redirect(
        `${process.env.DASHBOARD_URL}/auth/google/create?email=${(req.user as any).email}`,
      );
    }
  }

  @Post("logout")
  @CacheInvalidate("isAuthenticated")
  async logout(@Req() req: Request, @Res() res: Response) {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: "Internal Server Error" });
        }
        res.clearCookie("__session");
        return res.redirect("/auth/signin");
      });
    } else {
      return res.redirect("/auth/signin");
    }
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Res() res: Response) {
    await this.authService.sendPasswordResetLink(dto.email);
    return res.json({
      message: "Password reset link has been sent to your email",
    });
  }

  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto, @Res() res: Response) {
    const { token, password } = body;
    await this.authService.resetPassword(token, password);
    return res.redirect("/auth/signin");
  }

  @SkipThrottle()
  @Cache(60)
  @Get("check")
  async isAuthenticated(@Req() req: Request) {
    return this.authService.isAuthenticated(req?.session);
  }
}
