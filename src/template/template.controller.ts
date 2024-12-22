import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
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
    @Req() req: Request,
  ) {
    return this.templateService.templates(dto, req.session.organization.id);
  }

  @Get(":id")
  async getTemplate(@Param("id") id: string, @Req() req: Request) {
    return this.templateService.template({
      id,
      organizationId: req.session.organization.id,
    });
  }

  @Post("create")
  async createTemplate(@Body() dto: CreateTemplateDto, @Req() req: Request) {
    return await this.templateService.createTemplate(
      req.session.organization.id,
      dto,
    );
  }

  @Put("update/:id")
  async updateTemplate(
    @Req() req: Request,
    @Body() dto: UpdateTemplateDto,
    @Param("id") id: string,
  ) {
    return await this.templateService.updateTemplate(
      {
        id,
        organizationId: req.session.organization.id,
      },
      dto,
    );
  }

  @Delete("delete/:id")
  async deleteTemplate(@Req() req: Request, @Param("id") id: string) {
    return await this.templateService.deleteTemplate({
      id,
      organizationId: req.session.organization.id,
    });
  }
}
