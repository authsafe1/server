import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { UpdateBrandingDto } from "../common/dtos/branding.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { BrandingService } from "./branding.service";

@UseGuards(EnsureLoginGuard)
@Controller("branding")
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Put("branding/update")
  async updateBranding(@Req() req: Request, @Body() dto: UpdateBrandingDto) {
    return await this.brandingService.updateBranding(
      { organizationId: req.session?.organization?.id },
      dto,
    );
  }

  @Get()
  async getBranding(
    @Query("organizationId") organizationId: string,
    @Req() req: Request,
  ) {
    return await this.brandingService.getBranding({
      organizationId: req.session?.organization?.id || organizationId,
    });
  }
}
