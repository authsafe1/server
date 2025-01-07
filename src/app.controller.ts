import { Controller, Get } from "@nestjs/common";

@Controller("")
export class AppController {
  @Get("")
  getRoot() {
    return { message: "Server is up and running" };
  }
}
