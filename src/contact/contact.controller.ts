import { Body, Controller, Post } from "@nestjs/common";
import { EngineeringDto, SalesDto } from "../common/dtos/contact.dto";
import { ContactService } from "./contact.service";

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post("sales")
  async contactSales(@Body() dto: SalesDto) {
    return await this.contactService.contactSales(dto);
  }

  @Post("engineering")
  async contactEngineering(@Body() dto: EngineeringDto) {
    return await this.contactService.contactEngineering(dto);
  }
}
