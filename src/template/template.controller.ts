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
  CreateTemplateDto,
  TemplatesDto,
  UpdateTemplateDto,
} from "../common/dtos/template.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { TemplateService } from "./template.service";

@UseGuards(EnsureLoginGuard)
@Controller("template")
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post("all")
  async templates(
    @Body()
    dto: TemplatesDto,
    @Session() session: Request["session"],
  ) {
    return this.templateService.templates(dto, session?.organization?.id);
  }

  @Get(":id")
  async getTemplate(
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return this.templateService.template({
      id,
      organizationId: session?.organization?.id,
    });
  }

  @Post("create")
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Session() session: Request["session"],
  ) {
    return await this.templateService.createTemplate(
      dto,
      session?.organization?.id,
    );
  }

  @Put("update/:id")
  async updateTemplate(
    @Body() dto: UpdateTemplateDto,
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return await this.templateService.updateTemplate(
      {
        id,
        organizationId: session?.organization?.id,
      },
      dto,
    );
  }

  @Delete("delete/:id")
  async deleteTemplate(
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return await this.templateService.deleteTemplate({
      id,
      organizationId: session?.organization?.id,
    });
  }
}
