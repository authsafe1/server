// permission.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiKeysDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
} from "../common/dtos/apiKey.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ApiKeyService } from "./apiKey.service";

@UseGuards(EnsureLoginGuard)
@Controller("api-key")
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post("create")
  async create(
    @Body() dto: CreateApiKeyDto,
    @Session() session: Request["session"],
  ) {
    return this.apiKeyService.createApiKey(
      { ...dto },
      session.organization?.Secret?.id,
    );
  }

  @Post("all")
  async findAll(
    @Body() dto: ApiKeysDto,
    @Session() session: Request["session"],
  ) {
    const apikey = await this.apiKeyService.getAllApiKeys(
      dto,
      session?.organization?.Secret?.id,
    );
    return apikey;
  }

  @Get("count")
  async getCount(@Session() session: Request["session"]) {
    return this.apiKeyService.countApiKeys({
      secretId: session?.organization?.Secret?.id,
    });
  }

  @Put("update/:token")
  async updateApiKey(
    @Param("token") token: string,
    @Body() dto: UpdateApiKeyDto,
    @Session() session: Request["session"],
  ) {
    return this.apiKeyService.updateApiKey(
      dto,
      token,
      session?.organization?.Secret?.id,
    );
  }

  @Get(":token")
  async findOne(
    @Param("token") token: string,
    @Session() session: Request["session"],
  ) {
    return this.apiKeyService.getApiKeyByToken(
      token,
      session?.organization?.Secret?.id,
    );
  }

  @Delete("delete/:token")
  async remove(
    @Param("token") token: string,
    @Session() session: Request["session"],
  ) {
    return this.apiKeyService.deleteApiKey(
      token,
      session?.organization?.Secret?.id,
    );
  }
}
