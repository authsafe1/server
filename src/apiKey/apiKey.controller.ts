// permission.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { ApiKeysDto, CreateApiKeyDto } from "src/common/dtos/apiKey.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ApiKeyService } from "./apiKey.service";

@UseGuards(EnsureLoginGuard)
@Controller("api-key")
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post("create")
  async create(@Body() dto: CreateApiKeyDto, @Req() req: Request) {
    return this.apiKeyService.createApiKey(
      { ...dto },
      req.session.organization?.Secret?.id,
    );
  }

  @Post("all")
  async findAll(@Body() dto: ApiKeysDto, @Req() req: Request) {
    const apikey = await this.apiKeyService.getAllApiKeys(
      dto,
      req.session.organization?.Secret?.id,
    );
    return apikey;
  }

  @Get("count")
  async getCount(@Req() req: Request) {
    return this.apiKeyService.countApiKeys({
      secretId: req.session.organization?.Secret?.id,
    });
  }

  @Get(":token")
  async findOne(@Param("token") token: string, @Req() req: Request) {
    return this.apiKeyService.getApiKeyByToken(
      token,
      req.session.organization?.Secret?.id,
    );
  }

  @Delete("delete/:token")
  async remove(@Param("token") token: string, @Req() req: Request) {
    return this.apiKeyService.deleteApiKey(
      token,
      req.session.organization?.Secret?.id,
    );
  }
}
