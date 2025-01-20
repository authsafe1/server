import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Session,
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

  @Put("update")
  async updateBranding(
    @Body() dto: UpdateBrandingDto,
    @Session() session: Request["session"],
  ) {
    return await this.brandingService.updateBranding(
      { organizationId: session?.organization?.id },
      dto,
    );
  }

  @Get()
  async getBranding(
    @Query("organizationId") organizationId: string,
    @Session() session: Request["session"],
  ) {
    return await this.brandingService.getBranding({
      organizationId: session?.organization?.id || organizationId,
    });
  }
}
