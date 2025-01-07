import { Controller, Get } from "@nestjs/common";

@Controller("")
export class AppController {
  @Get("")
  root() {
    return { message: "Server is up and running" };
  }
}
