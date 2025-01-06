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
      {
        id: req.session.organization.id,
        Secret: req.session.organization.Secret,
      },
    );
  }

  @Post("all")
  async findAll(@Body() dto: ApiKeysDto) {
    return this.apiKeyService.getAllApiKeys(dto);
  }

  @Get("count")
  async getCount() {
    return this.apiKeyService.countApiKeys({});
  }

  @Get(":token")
  async findOne(@Param("token") token: string, @Req() req: Request) {
    return this.apiKeyService.getApiKeyByToken(token, req.session.organization);
  }

  @Delete("delete/:id")
  async remove(@Param("id") id: string) {
    return this.apiKeyService.deleteApiKey(id);
  }
}
